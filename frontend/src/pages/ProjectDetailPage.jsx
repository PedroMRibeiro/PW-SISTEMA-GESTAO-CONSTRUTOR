import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api.js';
import { computeTotals } from '../budgetMath.js';
import { STATUS_LABELS, STATUS_OPTIONS, statusBadgeClass } from '../status.js';

function fmtEUR(n) {
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(n || 0);
}

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
  const [project, setProject] = useState(null);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [ivaRate, setIvaRate] = useState('23');
  const [profitRate, setProfitRate] = useState('0');
  const [lines, setLines] = useState([]);
  const [budget, setBudget] = useState({ subtotal: 0, iva_amount: 0, total: 0, iva_rate: 23 });

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
    () => computeTotals([{ quantity: newQty, unit_price: newPrice }], ivaRate),
    [newQty, newPrice, ivaRate],
  );

  async function saveMeta(e) {
    e.preventDefault();
    setError('');
    try {
      const p = await api(`/api/projects/${id}`, {
        method: 'PUT',
        body: { name, description, iva_rate: Number(ivaRate), profit_rate: Number(profitRate) },
      });
      setProject(p);
      setBudget(p.budget);
      setLines(
        (p.budget_lines || []).map((l) => ({
          ...l,
          quantity: String(l.quantity),
          unit_price: String(l.unit_price),
        })),
      );
    } catch (err) {
      setError(err.body?.error || err.message);
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
      setBudget({
        subtotal: res.subtotal,
        iva_amount: res.iva_amount,
        total: res.total,
        iva_rate: res.iva_rate,
      });
      setLines(
        res.lines.map((l) => ({
          ...l,
          quantity: String(l.quantity),
          unit_price: String(l.unit_price),
        })),
      );
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
        body: {
          description: newDesc,
          quantity: Number(newQty),
          unit_price: Number(newPrice),
        },
      });
      setNewDesc('');
      setNewQty('1');
      setNewPrice('0');
      setBudget({
        subtotal: res.subtotal,
        iva_amount: res.iva_amount,
        total: res.total,
        iva_rate: res.iva_rate,
      });
      setLines(
        res.lines.map((l) => ({
          ...l,
          quantity: String(l.quantity),
          unit_price: String(l.unit_price),
        })),
      );
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
      setBudget({
        subtotal: res.subtotal,
        iva_amount: res.iva_amount,
        total: res.total,
        iva_rate: res.iva_rate,
      });
      setLines(
        res.lines.map((l) => ({
          ...l,
          quantity: String(l.quantity),
          unit_price: String(l.unit_price),
        })),
      );
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
      const p = await api(`/api/projects/${id}/status`, {
        method: 'PATCH',
        body: { status: next },
      });
      setProject(p);
      setBudget(p.budget);
      setStatusSelect(p.status);
    } catch (err) {
      setError(err.body?.error || err.message);
      setStatusSelect(project.status);
    }
  }

  const tableTotals = useMemo(() => computeTotals(lines, ivaRate), [lines, ivaRate]);

  if (!project && !error) {
    return <p className="muted">A carregar…</p>;
  }
  if (!project && error) {
    return <div className="alert alert-error">{error}</div>;
  }

  return (
    <div>
      <h1>{project.name}</h1>
      <p className="muted">
        Cliente: <strong>{project.client_name}</strong> ·{' '}
        <span className={statusBadgeClass(project.status)}>{STATUS_LABELS[project.status]}</span>
      </p>
      {error ? <div className="alert alert-error">{error}</div> : null}

      <div className="card">
        <h2>Dados do projeto</h2>
        <form onSubmit={saveMeta}>
          <div className="grid2">
            <div className="field">
              <label htmlFor="pname">Nome</label>
              <input id="pname" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="field">
              <label htmlFor="piva">IVA (%)</label>
              <input
                id="piva"
                type="number"
                step="0.01"
                min="0"
                value={ivaRate}
                onChange={(e) => setIvaRate(e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="pprofit">Lucro do construtor (%)</label>
              <input
                id="pprofit"
                type="number"
                step="0.01"
                min="0"
                value={profitRate}
                onChange={(e) => setProfitRate(e.target.value)}
              />
            </div>
          </div>
          <div className="field">
            <label htmlFor="pdesc">Descrição</label>
            <textarea id="pdesc" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <button type="submit" className="btn btn-primary">
            Guardar dados
          </button>
        </form>

        <div className="field" style={{ marginTop: '1rem' }}>
          <label htmlFor="st">Alterar estado</label>
          <select
            id="st"
            value={statusSelect}
            onChange={(e) => {
              const next = e.target.value;
              setStatusSelect(next);
              if (next === project.status) return;
              setStatusModal({
                open: true,
                next,
                label: STATUS_LABELS[next],
              });
            }}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="card">
        <h2>Orçamento (tabela editável)</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Descrição</th>
                <th className="mono">Qtd</th>
                <th className="mono">Preço unit.</th>
                <th className="mono">Subtotal linha</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {lines.length === 0 ? (
                <tr>
                  <td colSpan={5} className="muted">
                    Sem linhas. Adicione abaixo.
                  </td>
                </tr>
              ) : (
                lines.map((line) => {
                  const lt = (Number(line.quantity) || 0) * (Number(line.unit_price) || 0);
                  return (
                    <tr key={line.id}>
                      <td>
                        <input
                          value={line.description}
                          onChange={(e) => updateLineLocal(line.id, 'description', e.target.value)}
                          style={{ width: '100%', minWidth: 180 }}
                        />
                      </td>
                      <td>
                        <input
                          className="mono"
                          value={line.quantity}
                          onChange={(e) => updateLineLocal(line.id, 'quantity', e.target.value)}
                          style={{ width: 96 }}
                        />
                      </td>
                      <td>
                        <input
                          className="mono"
                          value={line.unit_price}
                          onChange={(e) => updateLineLocal(line.id, 'unit_price', e.target.value)}
                          style={{ width: 110 }}
                        />
                      </td>
                      <td className="mono">{fmtEUR(lt)}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <button type="button" className="btn" onClick={() => saveLine(line)}>
                          Guardar
                        </button>{' '}
                        <button
                          type="button"
                          className="btn btn-danger"
                          onClick={() => setDeleteLineModal({ open: true, lineId: line.id })}
                        >
                          Apagar
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <p className="muted" style={{ marginTop: '0.75rem' }}>
          Resumo com taxa atual ({ivaRate}% IVA): subtotal {fmtEUR(tableTotals.subtotal)}, IVA{' '}
          {fmtEUR(tableTotals.iva_amount)}, total {fmtEUR(tableTotals.total)}. Os valores oficiais seguem o servidor
          após guardar.
        </p>
        <p className="mono" style={{ fontSize: '1.05rem' }}>
          Totais guardados: {fmtEUR(budget.subtotal)} + IVA {fmtEUR(budget.iva_amount)} ={' '}
          <strong>{fmtEUR(budget.total)}</strong>
        </p>
      </div>

      <div className="card">
        <h2>Nova linha de orçamento</h2>
        <form onSubmit={addLine}>
          <div className="grid2">
            <div className="field">
              <label>Descrição</label>
              <input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} required />
            </div>
            <div className="field">
              <label>Quantidade</label>
              <input
                className="mono"
                type="number"
                step="any"
                min="0"
                value={newQty}
                onChange={(e) => setNewQty(e.target.value)}
              />
            </div>
            <div className="field">
              <label>Preço unitário (€)</label>
              <input
                className="mono"
                type="number"
                step="any"
                min="0"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
              />
            </div>
          </div>
          <p className="muted">
            Pré-visualização imediata: subtotal da linha {fmtEUR(previewNewLine.lines[0]?.line_subtotal || 0)} (taxa de
            IVA do projeto: {ivaRate}%).
          </p>
          <button type="submit" className="btn btn-primary">
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
