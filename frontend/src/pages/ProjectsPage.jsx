import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { STATUS_LABELS, STATUS_OPTIONS, statusBadgeClass } from '../status.js';
import { ErrorAlert, EmptyState, TableSkeleton, fmtEUR } from '../components/ui.jsx';
import { PlusIcon, SearchIcon, ProjectsIcon, TrashIcon } from '../components/icons.jsx';

export default function ProjectsPage() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [query, setQuery] = useState('');

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

  async function removeProject(id, name) {
    if (!window.confirm(`Eliminar o projeto «${name}»? Esta ação não pode ser desfeita.`)) return;
    setError('');
    try {
      await api(`/api/projects/${id}`, { method: 'DELETE' });
      setRows((r) => r.filter((p) => p.id !== id));
    } catch (e) {
      setError(e.body?.error || e.message);
    }
  }

  const filtered = useMemo(() => {
    let list = [...rows];
    if (statusFilter) list = list.filter((p) => p.status === statusFilter);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter((p) => p.name?.toLowerCase().includes(q) || p.client_name?.toLowerCase().includes(q));
    }
    if (sortBy === 'price_desc') list.sort((a, b) => (b.budget_total || 0) - (a.budget_total || 0));
    else if (sortBy === 'price_asc') list.sort((a, b) => (a.budget_total || 0) - (b.budget_total || 0));
    return list;
  }, [rows, statusFilter, sortBy, query]);

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Projetos</h1>
          <p className="subtitle">Estado e cliente de cada obra. O orçamento final inclui subtotal, IVA e lucro.</p>
        </div>
        <Link to="/projetos/novo" className="btn btn-primary">
          <PlusIcon size={18} />
          Novo projeto
        </Link>
      </div>

      <ErrorAlert>{error}</ErrorAlert>

      {!loading && rows.length > 0 ? (
        <div className="toolbar">
          <div className="input-icon" style={{ minWidth: 220, flex: '1 1 240px', maxWidth: 360 }}>
            <SearchIcon size={17} />
            <input
              className="input"
              placeholder="Pesquisar por obra ou cliente…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <select className="input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filtrar por estado">
            <option value="">Todos os estados</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
          <select className="input" value={sortBy} onChange={(e) => setSortBy(e.target.value)} aria-label="Ordenar">
            <option value="recent">Mais recentes</option>
            <option value="price_desc">Orçamento: maior → menor</option>
            <option value="price_asc">Orçamento: menor → maior</option>
          </select>
          <span className="spacer" />
          <span className="muted" style={{ fontSize: '0.85rem' }}>
            {filtered.length} de {rows.length} projeto(s)
          </span>
        </div>
      ) : null}

      {loading ? (
        <TableSkeleton rows={5} cols={5} />
      ) : rows.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<ProjectsIcon size={26} />}
            title="Ainda não há projetos"
            message="Crie o seu primeiro projeto para começar a orçamentar."
            action={
              <Link to="/projetos/novo" className="btn btn-primary btn-sm">
                <PlusIcon size={16} />
                Criar projeto
              </Link>
            }
          />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card">
          <EmptyState icon={<SearchIcon size={26} />} title="Sem resultados" message="Nenhum projeto corresponde aos filtros aplicados." />
        </div>
      ) : (
        <div className="card card-pad-0">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Cliente</th>
                  <th>Estado</th>
                  <th className="mono" style={{ textAlign: 'right' }}>
                    Orçamento final
                  </th>
                  <th style={{ width: 1 }} />
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <Link to={`/projetos/${p.id}`} className="link-strong">
                        {p.name}
                      </Link>
                    </td>
                    <td className="muted">{p.client_name}</td>
                    <td>
                      <span className={statusBadgeClass(p.status)}>{STATUS_LABELS[p.status]}</span>
                    </td>
                    <td className="mono" style={{ textAlign: 'right', fontWeight: 600 }}>
                      {fmtEUR(p.budget_total)}
                    </td>
                    <td>
                      <div className="cell-actions">
                        <button
                          type="button"
                          className="btn btn-danger btn-sm btn-icon"
                          title="Eliminar projeto"
                          aria-label="Eliminar projeto"
                          onClick={() => removeProject(p.id, p.name)}
                        >
                          <TrashIcon size={16} />
                        </button>
                      </div>
                    </td>
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
