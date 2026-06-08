import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { STATUS_LABELS } from '../status.js';
import { ErrorAlert, StatCard, CardsSkeleton, fmtEUR } from '../components/ui.jsx';
import { EuroIcon, TrendIcon, CloseIcon } from '../components/icons.jsx';

function ProjectsModal({ statusKey, block, onClose }) {
  if (!statusKey || !block) return null;
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <div className="modal modal-wide" role="dialog" aria-modal="true" aria-labelledby="report-modal-title" onMouseDown={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 id="report-modal-title" style={{ marginTop: 0, marginBottom: '0.25rem' }}>
              {STATUS_LABELS[statusKey]}
            </h2>
            <p className="muted" style={{ margin: 0 }}>
              {block.count} projeto(s) · Total {fmtEUR(block.total_billing)} · Lucro {fmtEUR(block.total_profit)}
            </p>
          </div>
          <button type="button" className="btn btn-ghost btn-icon" aria-label="Fechar" onClick={onClose}>
            <CloseIcon size={18} />
          </button>
        </div>
        {block.projects.length === 0 ? (
          <p className="muted" style={{ marginTop: '1rem' }}>
            Nenhum projeto neste estado.
          </p>
        ) : (
          <div className="table-wrap" style={{ maxHeight: 'min(60vh, 420px)', overflow: 'auto', marginTop: '1rem' }}>
            <table>
              <thead>
                <tr>
                  <th>Projeto</th>
                  <th className="mono" style={{ textAlign: 'right' }}>
                    Total
                  </th>
                  <th className="mono" style={{ textAlign: 'right' }}>
                    Lucro
                  </th>
                </tr>
              </thead>
              <tbody>
                {block.projects.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <Link to={`/projetos/${p.id}`} className="link-strong" onClick={onClose}>
                        {p.name}
                      </Link>
                    </td>
                    <td className="mono" style={{ textAlign: 'right' }}>
                      {fmtEUR(p.total)}
                    </td>
                    <td className="mono" style={{ textAlign: 'right' }}>
                      {fmtEUR(p.profit_amount)} <span className="muted">({p.profit_rate}%)</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="modal-actions">
          <button type="button" className="btn btn-primary" onClick={onClose}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ReportPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [modalStatus, setModalStatus] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const d = await api('/api/reports/by-status');
        if (!cancelled) setData(d);
      } catch (e) {
        if (!cancelled) setError(e.body?.error || e.message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const modalBlock = modalStatus && data ? data.by_status[modalStatus] : null;

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Relatório por estado</h1>
          <p className="subtitle">
            Projetos agrupados por estado. O total de cada orçamento inclui subtotal, IVA e o lucro do construtor.
          </p>
        </div>
      </div>

      <ErrorAlert>{error}</ErrorAlert>

      {!data ? (
        <CardsSkeleton count={2} />
      ) : (
        <>
          <div className="stat-grid">
            <StatCard
              label="Total global"
              value={fmtEUR(data.grand_total_billing)}
              sub="Faturação de todos os projetos (exceto cancelados)"
              icon={<EuroIcon size={20} />}
              tone="blue"
            />
            <StatCard
              label="Lucro global do construtor"
              value={fmtEUR(data.grand_total_profit)}
              sub="Estimativa com base na taxa de cada projeto"
              icon={<TrendIcon size={20} />}
              tone="green"
            />
          </div>

          <div className="card">
            <h2>Lucros por estado</h2>
            <p className="muted" style={{ marginTop: '-0.4rem', marginBottom: '1.1rem' }}>
              Distribuição do lucro estimado entre os vários estados.
            </p>
            <div style={{ display: 'grid', gap: '1rem' }}>
              {Object.entries(data.by_status).map(([key, block]) => {
                const pct = data.grand_total_profit > 0 ? (block.total_profit / data.grand_total_profit) * 100 : 0;
                return (
                  <div key={`profit-${key}`}>
                    <div className="bar-row">
                      <span>{STATUS_LABELS[key]}</span>
                      <strong className="mono">{fmtEUR(block.total_profit)}</strong>
                    </div>
                    <div className="bar-track">
                      <div className="bar-fill" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card">
            <h2>Obras por estado</h2>
            <p className="muted" style={{ marginTop: '-0.4rem', marginBottom: '1.1rem' }}>
              Resumo por estado. Use “Ver projetos” para abrir a lista completa.
            </p>
            <div className="status-report-grid">
              {Object.entries(data.by_status).map(([key, block]) => (
                <div key={key} className="status-report-card">
                  <h3>
                    <span className={`badge badge-${key}`}>{STATUS_LABELS[key]}</span>
                  </h3>
                  <p className="muted" style={{ margin: '0 0 0.7rem', fontSize: '0.85rem' }}>
                    {block.count} projeto(s)
                  </p>
                  <div className="report-line">
                    <span>Total</span>
                    <strong className="mono">{fmtEUR(block.total_billing)}</strong>
                  </div>
                  <div className="report-line">
                    <span>Lucro</span>
                    <strong className="mono">{fmtEUR(block.total_profit)}</strong>
                  </div>
                  <button
                    type="button"
                    className="btn btn-sm btn-block"
                    style={{ marginTop: '0.85rem' }}
                    onClick={() => setModalStatus(key)}
                    disabled={block.count === 0}
                  >
                    Ver projetos
                  </button>
                </div>
              ))}
            </div>
          </div>

          <ProjectsModal statusKey={modalStatus} block={modalBlock} onClose={() => setModalStatus(null)} />
        </>
      )}
    </div>
  );
}
