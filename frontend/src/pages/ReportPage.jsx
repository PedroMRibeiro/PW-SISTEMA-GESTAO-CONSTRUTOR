import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { STATUS_LABELS } from '../status.js';

function fmtEUR(n) {
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(n || 0);
}

export default function ReportPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

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

  return (
    <div>
      <h1>Relatório por estado</h1>
      <p className="muted">Projetos agrupados por estado e faturação total (soma dos orçamentos com IVA).</p>
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
              Lucro global estimado: <strong>{fmtEUR(data.grand_total_profit)}</strong>
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
                        background: '#e5e7eb',
                        borderRadius: 999,
                        overflow: 'hidden',
                        marginTop: 6,
                      }}
                    >
                      <div
                        style={{
                          width: `${pct}%`,
                          height: '100%',
                          background: 'linear-gradient(90deg, #2563eb 0%, #1d4ed8 100%)',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="grid2">
            {Object.entries(data.by_status).map(([key, block]) => (
              <div key={key} className="card">
                <h2>{STATUS_LABELS[key]}</h2>
                <p className="muted" style={{ margin: '0 0 0.5rem' }}>
                  {block.count} projeto(s) · Total {fmtEUR(block.total_billing)} · Lucro {fmtEUR(block.total_profit)}
                </p>
                <ul style={{ margin: 0, paddingLeft: '1.1rem' }}>
                  {block.projects.map((p) => (
                    <li key={p.id}>
                      <Link to={`/projetos/${p.id}`}>{p.name}</Link> — {fmtEUR(p.total)} · lucro {fmtEUR(p.profit_amount)} (
                      {p.profit_rate}%)
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
