import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { STATUS_LABELS } from '../status.js';

function fmtEUR(n) {
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(n || 0);
}

function ProjectsModal({ statusKey, block, onClose }) {
  if (!statusKey || !block) return null;

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <div
        className="modal modal-wide"
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-modal-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h2 id="report-modal-title" style={{ marginTop: 0 }}>
          {STATUS_LABELS[statusKey]}
        </h2>
        <p className="muted" style={{ marginTop: 0 }}>
          {block.count} projeto(s) · Total {fmtEUR(block.total_billing)} · Lucro {fmtEUR(block.total_profit)}
        </p>
        {block.projects.length === 0 ? (
          <p className="muted">Nenhum projeto neste estado.</p>
        ) : (
          <div className="table-wrap" style={{ maxHeight: 'min(60vh, 420px)', overflow: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Projeto</th>
                  <th className="mono">Total</th>
                  <th className="mono">Lucro</th>
                </tr>
              </thead>
              <tbody>
                {block.projects.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <Link to={`/projetos/${p.id}`} onClick={onClose}>
                        {p.name}
                      </Link>
                    </td>
                    <td className="mono">{fmtEUR(p.total)}</td>
                    <td className="mono">
                      {fmtEUR(p.profit_amount)} ({p.profit_rate}%)
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
      <h1>Relatório por estado</h1>
      <p className="muted">
        Projetos agrupados por estado. O total de cada orçamento inclui subtotal + IVA + lucro do construtor.
      </p>
      {error ? <div className="alert alert-error">{error}</div> : null}
      {!data ? (
        <p className="muted">A carregar…</p>
      ) : (
        <>
          <div className="card">
            <h2>Resumo</h2>
            <p className="mono" style={{ fontSize: '1.25rem', margin: 0 }}>
              Total global: <strong>{fmtEUR(data.grand_total_billing)}</strong>
            </p>
            <p className="mono" style={{ fontSize: '1.1rem', margin: '0.5rem 0 0' }}>
              Lucro global do construtor: <strong>{fmtEUR(data.grand_total_profit)}</strong>
            </p>
            <p className="muted" style={{ margin: '0.75rem 0 0', fontSize: '0.85rem' }}>
              
            </p>
          </div>
          <div className="card">
            <h2>Lucros por estado</h2>
            <p className="muted" style={{ marginTop: 0 }}>
              Estimativa com base na taxa de lucro de cada projeto.
            </p>
            <div style={{ display: 'grid', gap: '0.65rem' }}>
              {Object.entries(data.by_status).map(([key, block]) => {
                const pct = data.grand_total_profit > 0 ? (block.total_profit / data.grand_total_profit) * 100 : 0;
                return (
                  <div key={`profit-${key}`}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem' }}>
                      <span>{STATUS_LABELS[key]}</span>
                      <strong>{fmtEUR(block.total_profit)}</strong>
                    </div>
                    <div
                      style={{
                        width: '100%',
                        height: 12,
                        background: 'var(--surface2)',
                        borderRadius: 999,
                        overflow: 'hidden',
                        marginTop: 6,
                      }}
                    >
                      <div
                        style={{
                          width: `${pct}%`,
                          height: '100%',
                          background: 'linear-gradient(90deg, var(--success) 0%, #2da86a 100%)',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="card">
            <h2>Obras por estado</h2>
            <p className="muted" style={{ marginTop: 0 }}>
              Resumo por estado. Use &quot;Ver projetos&quot; para abrir a lista completa.
            </p>
            <div className="status-report-grid">
              {Object.entries(data.by_status).map(([key, block]) => (
                <div key={key} className="status-report-card">
                  <h3>{STATUS_LABELS[key]}</h3>
                  <p className="muted" style={{ margin: '0 0 0.75rem', fontSize: '0.9rem' }}>
                    {block.count} projeto(s)
                  </p>
                  <p className="mono" style={{ margin: '0 0 0.25rem', fontSize: '0.95rem' }}>
                    Total: <strong>{fmtEUR(block.total_billing)}</strong>
                  </p>
                  <p className="mono" style={{ margin: '0 0 0.85rem', fontSize: '0.95rem' }}>
                    Lucro: <strong>{fmtEUR(block.total_profit)}</strong>
                  </p>
                  <button
                    type="button"
                    className="btn"
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
