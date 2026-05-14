import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { STATUS_LABELS, statusBadgeClass } from '../status.js';

function fmtEUR(n) {
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(n || 0);
}

export default function ProjectsPage() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await api('/api/projects');
        if (!cancelled) setRows(data);
      } catch (e) {
        if (!cancelled) setError(e.body?.error || e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '1rem' }}>
        <h1>Projetos</h1>
        <Link to="/projetos/novo" className="btn btn-primary">
          Novo projeto
        </Link>
      </div>
      <p className="muted">Estado atual e cliente associado a cada obra.</p>
      {error ? <div className="alert alert-error">{error}</div> : null}
      {loading ? (
        <p className="muted">A carregar…</p>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrap" style={{ border: 'none' }}>
            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Cliente</th>
                  <th>Estado</th>
                  <th className="mono">Orçamento</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
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
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
