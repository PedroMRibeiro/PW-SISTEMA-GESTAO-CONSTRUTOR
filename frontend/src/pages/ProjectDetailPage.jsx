import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { computeTotals } from '../budgetMath.js';
import { STATUS_LABELS, STATUS_OPTIONS, statusBadgeClass } from '../status.js';
import { ErrorAlert, Spinner, EmptyState, fmtEUR } from '../components/ui.jsx';
import { ArrowLeftIcon, PlusIcon, SaveIcon, TrashIcon, LayersIcon } from '../components/icons.jsx';

function ConfirmModal({ open, title, message, onCancel, onConfirm, danger }) {
  if (!open) return null;
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onCancel}>
      <div className="modal" role="dialog" aria-modal="true" onMouseDown={(e) => e.stopPropagation()}>
        <h2 style={{ marginTop: 0 }}>{title}</h2>
        <p className="muted">{message}</p>
        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            Cancelar
          </button>
          <button type="button" className={danger ? 'btn btn-danger' : 'btn btn-primary'} onClick={onConfirm}>
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [ivaRate, setIvaRate] = useState('23');
  const [profitRate, setProfitRate] = useState('0');
  const [lines, setLines] = useState([]);
  const [budget, setBudget] = useState({
    subtotal: 0,
    iva_amount: 0,
    profit_amount: 0,
    total: 0,
    iva_rate: 23,
    profit_rate: 0,
  });

  const [newDesc, setNewDesc] = useState('');
  const [newQty, setNewQty] = useState('1');
  const [newPrice, setNewPrice] = useState('0');

  const [statusModal, setStatusModal] = useState({ open: false, next: null, label: null });
  const [statusSelect, setStatusSelect] = useState('orcamento');
  const [deleteLineModal, setDeleteLineModal] = useState({ open: false, lineId: null });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const p = await api(`/api/projects/${id}`);
        if (cancelled) return;
        setProject(p);
        setName(p.name);
        setDescription(p.description || '');
        setIvaRate(String(p.iva_rate));
        setProfitRate(String(p.profit_rate ?? 0));
        setLines(
          (p.budget_lines || []).map((l) => ({
            ...l,
            quantity: String(l.quantity),
            unit_price: String(l.unit_price),
          })),
        );
        setBudget(p.budget);
        setStatusSelect(p.status);
      } catch (e) {
        if (!cancelled) setError(e.body?.error || e.message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const previewNewLine = useMemo(
    () => computeTotals([{ quantity: newQty, unit_price: newPrice }], ivaRate, profitRate),
    [newQty, newPrice, ivaRate, profitRate],
  );

  function applyBudgetResponse(res) {
    setBudget({
      subtotal: res.subtotal,
      iva_amount: res.iva_amount,
      profit_amount: res.profit_amount,
      total: res.total,
      iva_rate: res.iva_rate,
      profit_rate: res.profit_rate,
    });
    setLines(
      res.lines.map((l) => ({
        ...l,
        quantity: String(l.quantity),
        unit_price: String(l.unit_price),
      })),
    );
  }

  async function saveAll() {
    setError('');
    setSaving(true);
    try {
      await api(`/api/projects/${id}`, {
        method: 'PUT',
        body: { name, description, iva_rate: Number(ivaRate), profit_rate: Number(profitRate) },
      });
      for (const line of lines) {
        await api(`/api/projects/${id}/lines/${line.id}`, {
          method: 'PUT',
          body: {
            description: line.description,
            quantity: Number(line.quantity),
            unit_price: Number(line.unit_price),
            display_order: line.display_order,
          },
        });
      }
      navigate('/projetos');
    } catch (err) {
      setError(err.body?.error || err.message);
    } finally {
      setSaving(false);
    }
  }

  function updateLineLocal(lineId, field, value) {
    setLines((prev) => prev.map((l) => (l.id === lineId ? { ...l, [field]: value } : l)));
  }

  async function saveLine(line) {
    setError('');
    try {
      const res = await api(`/api/projects/${id}/lines/${line.id}`, {
        method: 'PUT',
        body: {
          description: line.description,
          quantity: Number(line.quantity),
          unit_price: Number(line.unit_price),
          display_order: line.display_order,
        },
      });
      applyBudgetResponse(res);
    } catch (err) {
      setError(err.body?.error || err.message);
    }
  }

  async function addLine(e) {
    e.preventDefault();
    setError('');
    try {
      const res = await api(`/api/projects/${id}/lines`, {
        method: 'POST',
        body: { description: newDesc, quantity: Number(newQty), unit_price: Number(newPrice) },
      });
      setNewDesc('');
      setNewQty('1');
      setNewPrice('0');
      applyBudgetResponse(res);
    } catch (err) {
      setError(err.body?.error || err.message);
    }
  }

  async function deleteLineConfirmed() {
    const lineId = deleteLineModal.lineId;
    setDeleteLineModal({ open: false, lineId: null });
    if (!lineId) return;
    setError('');
    try {
      const res = await api(`/api/projects/${id}/lines/${lineId}`, { method: 'DELETE' });
      applyBudgetResponse(res);
    } catch (err) {
      setError(err.body?.error || err.message);
    }
  }

  async function confirmStatus() {
    const next = statusModal.next;
    setStatusModal({ open: false, next: null, label: null });
    if (!next) return;
    setError('');
    try {
      const p = await api(`/api/projects/${id}/status`, { method: 'PATCH', body: { status: next } });
      setProject(p);
      setBudget(p.budget);
      setStatusSelect(p.status);
    } catch (err) {
      setError(err.body?.error || err.message);
      setStatusSelect(project.status);
    }
  }

  const tableTotals = useMemo(() => computeTotals(lines, ivaRate, profitRate), [lines, ivaRate, profitRate]);

  if (!project && !error) {
    return (
      <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', color: 'var(--muted)' }}>
        <Spinner /> A carregar projeto…
      </div>
    );
  }
  if (!project && error) {
    return <ErrorAlert>{error}</ErrorAlert>;
  }

  return (
    <div>
      <Link to="/projetos" className="btn btn-ghost btn-sm" style={{ marginBottom: '0.9rem' }}>
        <ArrowLeftIcon size={16} />
        Voltar aos projetos
      </Link>

      <div className="page-head">
        <div>
          <h1>{project.name}</h1>
          <p className="subtitle">
            Cliente: <strong style={{ color: 'var(--text)' }}>{project.client_name}</strong> ·{' '}
            <span className={statusBadgeClass(project.status)}>{STATUS_LABELS[project.status]}</span>
          </p>
        </div>
        <button type="button" className="btn btn-primary" onClick={saveAll} disabled={saving || !name.trim()}>
          {saving ? <Spinner /> : <SaveIcon size={18} />}
          {saving ? 'A guardar…' : 'Guardar dados'}
        </button>
      </div>

      <ErrorAlert>{error}</ErrorAlert>

      <div className="stat-grid">
        <div className="stat">
          <div className="stat-top">
            <span className="stat-label">Subtotal</span>
          </div>
          <div className="stat-value mono" style={{ fontSize: '1.4rem' }}>
            {fmtEUR(budget.subtotal)}
          </div>
        </div>
        <div className="stat">
          <div className="stat-top">
            <span className="stat-label">IVA ({budget.iva_rate}%)</span>
          </div>
          <div className="stat-value mono" style={{ fontSize: '1.4rem' }}>
            {fmtEUR(budget.iva_amount)}
          </div>
        </div>
        <div className="stat">
          <div className="stat-top">
            <span className="stat-label">Lucro ({budget.profit_rate}%)</span>
          </div>
          <div className="stat-value mono" style={{ fontSize: '1.4rem' }}>
            {fmtEUR(budget.profit_amount)}
          </div>
        </div>
        <div className="stat" style={{ borderColor: 'rgba(61,156,245,0.4)' }}>
          <div className="stat-top">
            <span className="stat-label" style={{ color: 'var(--accent)' }}>
              Total do orçamento
            </span>
          </div>
          <div className="stat-value mono" style={{ fontSize: '1.4rem' }}>
            {fmtEUR(budget.total)}
          </div>
        </div>
      </div>

      <div className="card">
        <h2>Dados do projeto</h2>
        <div className="grid2">
          <div className="field">
            <label htmlFor="pname">Nome</label>
            <input id="pname" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="field">
            <label htmlFor="st">Estado</label>
            <select
              id="st"
              value={statusSelect}
              onChange={(e) => {
                const next = e.target.value;
                setStatusSelect(next);
                if (next === project.status) return;
                setStatusModal({ open: true, next, label: STATUS_LABELS[next] });
              }}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="piva">IVA (%)</label>
            <input id="piva" type="number" step="0.01" min="0" value={ivaRate} onChange={(e) => setIvaRate(e.target.value)} className="mono" />
          </div>
          <div className="field">
            <label htmlFor="pprofit">Lucro do construtor (%)</label>
            <input id="pprofit" type="number" step="0.01" min="0" value={profitRate} onChange={(e) => setProfitRate(e.target.value)} className="mono" />
          </div>
        </div>
        <div className="field" style={{ marginBottom: 0 }}>
          <label htmlFor="pdesc">Descrição</label>
          <textarea id="pdesc" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
      </div>

      <div className="card card-pad-0">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.1rem 1.3rem 0.9rem' }}>
          <h2 style={{ margin: 0 }}>Orçamento</h2>
          <span className="muted" style={{ fontSize: '0.82rem' }}>
            Tabela editável
          </span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Descrição</th>
                <th className="mono" style={{ width: 110 }}>
                  Qtd
                </th>
                <th className="mono" style={{ width: 130 }}>
                  Preço unit.
                </th>
                <th className="mono" style={{ textAlign: 'right' }}>
                  Subtotal
                </th>
                <th style={{ width: 1 }} />
              </tr>
            </thead>
            <tbody>
              {lines.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: 0 }}>
                    <EmptyState icon={<LayersIcon size={24} />} title="Sem linhas" message="Adicione a primeira linha de orçamento abaixo." />
                  </td>
                </tr>
              ) : (
                lines.map((line) => {
                  const lt = (Number(line.quantity) || 0) * (Number(line.unit_price) || 0);
                  return (
                    <tr key={line.id}>
                      <td>
                        <input
                          className="table-input"
                          value={line.description}
                          onChange={(e) => updateLineLocal(line.id, 'description', e.target.value)}
                          style={{ minWidth: 180 }}
                        />
                      </td>
                      <td>
                        <input className="table-input mono" value={line.quantity} onChange={(e) => updateLineLocal(line.id, 'quantity', e.target.value)} />
                      </td>
                      <td>
                        <input className="table-input mono" value={line.unit_price} onChange={(e) => updateLineLocal(line.id, 'unit_price', e.target.value)} />
                      </td>
                      <td className="mono" style={{ textAlign: 'right', fontWeight: 600 }}>
                        {fmtEUR(lt)}
                      </td>
                      <td>
                        <div className="cell-actions">
                          <button type="button" className="btn btn-sm btn-icon" title="Guardar linha" aria-label="Guardar linha" onClick={() => saveLine(line)}>
                            <SaveIcon size={16} />
                          </button>
                          <button
                            type="button"
                            className="btn btn-danger btn-sm btn-icon"
                            title="Apagar linha"
                            aria-label="Apagar linha"
                            onClick={() => setDeleteLineModal({ open: true, lineId: line.id })}
                          >
                            <TrashIcon size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <p className="muted" style={{ padding: '0.85rem 1.3rem', margin: 0, fontSize: '0.84rem', borderTop: '1px solid var(--border)' }}>
          Pré-visualização ({ivaRate}% IVA, {profitRate}% lucro): subtotal {fmtEUR(tableTotals.subtotal)} + IVA {fmtEUR(tableTotals.iva_amount)} + lucro{' '}
          {fmtEUR(tableTotals.profit_amount)} = <strong style={{ color: 'var(--text)' }}>{fmtEUR(tableTotals.total)}</strong>
        </p>
      </div>

      <div className="card">
        <h2>Nova linha de orçamento</h2>
        <form onSubmit={addLine}>
          <div className="grid2">
            <div className="field">
              <label>Descrição</label>
              <input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Ex.: Mão de obra — alvenaria" required />
            </div>
            <div className="field">
              <label>Quantidade</label>
              <input className="mono" type="number" step="any" min="0" value={newQty} onChange={(e) => setNewQty(e.target.value)} />
            </div>
            <div className="field">
              <label>Preço unitário (€)</label>
              <input className="mono" type="number" step="any" min="0" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} />
            </div>
          </div>
          <p className="muted" style={{ fontSize: '0.84rem' }}>
            Subtotal desta linha: <strong style={{ color: 'var(--text)' }}>{fmtEUR(previewNewLine.lines[0]?.line_subtotal || 0)}</strong>. O total do
            orçamento soma todas as linhas e aplica {ivaRate}% IVA + {profitRate}% lucro sobre o subtotal.
          </p>
          <button type="submit" className="btn btn-primary">
            <PlusIcon size={18} />
            Adicionar linha
          </button>
        </form>
      </div>

      <ConfirmModal
        open={statusModal.open}
        title="Confirmar alteração de estado"
        message={`Pretende alterar o estado para "${statusModal.label || ''}"?`}
        onCancel={() => {
          setStatusModal({ open: false, next: null, label: null });
          setStatusSelect(project.status);
        }}
        onConfirm={confirmStatus}
      />
      <ConfirmModal
        open={deleteLineModal.open}
        title="Apagar linha"
        message="Esta ação remove a linha do orçamento. Continuar?"
        danger
        onCancel={() => setDeleteLineModal({ open: false, lineId: null })}
        onConfirm={deleteLineConfirmed}
      />
    </div>
  );
}
