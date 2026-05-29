import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { STATUS_LABELS, STATUS_OPTIONS, statusBadgeClass } from '../status.js';

function fmtEUR(n) {
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(n || 0);
}

function FilterIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M3 5h18M6 12h12M10 19h4" strokeLinecap="round" />
    </svg>
  );
}

export default function ProjectsPage() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('recent');

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

  const filtered = useMemo(() => {
    let list = [...rows];
    if (statusFilter) {
      list = list.filter((p) => p.status === statusFilter);
    }
    if (sortBy === 'price_desc') {
      list.sort((a, b) => (b.budget_total || 0) - (a.budget_total || 0));
    } else if (sortBy === 'price_asc') {
      list.sort((a, b) => (a.budget_total || 0) - (b.budget_total || 0));
    }
    return list;
  }, [rows, statusFilter, sortBy]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '1rem' }}>
        <h1>Projetos</h1>
        <Link to="/projetos/novo" className="btn btn-primary">
          Novo projeto
        </Link>
      </div>
      <p className="muted">Estado atual e cliente associado a cada obra. Orçamento = subtotal + IVA + lucro.</p>
      {error ? <div className="alert alert-error">{error}</div> : null}

      {!loading && rows.length > 0 ? (
        <div
          className="card"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '0.75rem 1rem',
            marginBottom: '1rem',
            padding: '0.85rem 1rem',
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--muted)' }}>
            <FilterIcon />
            Filtrar
          </span>
          <div className="field" style={{ margin: 0, minWidth: 160 }}>
            <label htmlFor="filter-status">Estado</label>
            <select id="filter-status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">Todos</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </div>
          <div className="field" style={{ margin: 0, minWidth: 200 }}>
            <label htmlFor="filter-sort">Ordenar por</label>
            <select id="filter-sort" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="recent">Mais recentes (servidor)</option>
              <option value="price_desc">Orçamento: mais caro → mais barato</option>
              <option value="price_asc">Orçamento: mais barato → mais caro</option>
            </select>
          </div>
          <p className="muted" style={{ margin: 0, fontSize: '0.85rem' }}>
            {filtered.length} de {rows.length} projeto(s)
          </p>
        </div>
      ) : null}

      {loading ? (
        <p className="muted">A carregar…</p>
      ) : filtered.length === 0 ? (
        <p className="muted">{rows.length === 0 ? 'Ainda não há projetos.' : 'Nenhum projeto corresponde aos filtros.'}</p>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrap" style={{ border: 'none' }}>
            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Cliente</th>
                  <th>Estado</th>
                  <th className="mono">Orçamento final</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
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
