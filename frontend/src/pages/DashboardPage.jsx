import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { STATUS_LABELS, statusBadgeClass } from '../status.js';

function fmtEUR(n) {
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(n || 0);
}

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const d = await api('/api/reports/dashboard');
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
      <h1>Painel</h1>
      <p className="muted"></p>
      {error ? <div className="alert alert-error">{error}</div> : null}
      {!data ? (
        <p className="muted">A carregar…</p>
      ) : (
        <>
          <div className="grid2" style={{ marginBottom: '1rem' }}>
            <div className="card">
              <h2>Projetos ativos</h2>
              <p style={{ fontSize: '2rem', margin: 0, fontWeight: 700 }}>{data.active_count}</p>
            </div>
            <div className="card">
              <h2>Total em curso (IVA incl.)</h2>
              <p style={{ fontSize: '2rem', margin: 0, fontWeight: 700 }} className="mono">
                {fmtEUR(data.em_curso_total)}
              </p>
            </div>
          </div>
          <div className="card">
            <h2>Lista rápida</h2>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Projeto</th>
                    <th>Cliente</th>
                    <th>Estado</th>
                    <th className="mono">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {data.active_projects.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="muted">
                        Sem projetos ativos.
                      </td>
                    </tr>
                  ) : (
                    data.active_projects.map((p) => (
                      <tr key={p.id}>
                        <td>
                          <Link to={`/projetos/${p.id}`}>{p.name}</Link>
                        </td>
                        <td>{p.client_name}</td>
                        <td>
                          <span className={statusBadgeClass(p.status)}>{STATUS_LABELS[p.status]}</span>
                        </td>
                        <td className="mono">{fmtEUR(p.budget_total)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
