import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { STATUS_LABELS, statusBadgeClass } from '../status.js';
import { ErrorAlert, StatCard, EmptyState, TableSkeleton, CardsSkeleton, fmtEUR } from '../components/ui.jsx';
import { ProjectsIcon, EuroIcon, PlusIcon } from '../components/icons.jsx';

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
      <div className="page-head">
        <div>
          <h1>Painel</h1>
          <p className="subtitle">Resumo do estado atual das suas obras e faturação em curso.</p>
        </div>
        <Link to="/projetos/novo" className="btn btn-primary">
          <PlusIcon size={18} />
          Novo projeto
        </Link>
      </div>

      <ErrorAlert>{error}</ErrorAlert>

      {!data ? (
        <>
          <CardsSkeleton count={2} />
          <TableSkeleton rows={4} cols={4} />
        </>
      ) : (
        <>
          <div className="stat-grid">
            <StatCard
              label="Projetos ativos"
              value={data.active_count}
              sub="Em orçamento, aprovadas ou em curso"
              icon={<ProjectsIcon size={20} />}
              tone="blue"
            />
            <StatCard
              label="Total em curso (IVA incl.)"
              value={fmtEUR(data.em_curso_total)}
              sub="Valor das obras atualmente em execução"
              icon={<EuroIcon size={20} />}
              tone="green"
            />
          </div>

          <div className="card card-pad-0">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.1rem 1.3rem 0.9rem' }}>
              <h2 style={{ margin: 0 }}>Projetos ativos</h2>
              <Link to="/projetos" className="btn btn-sm btn-ghost">
                Ver todos
              </Link>
            </div>
            {data.active_projects.length === 0 ? (
              <EmptyState
                icon={<ProjectsIcon size={26} />}
                title="Sem projetos ativos"
                message="Crie o seu primeiro projeto para começar a gerir orçamentos e obras."
                action={
                  <Link to="/projetos/novo" className="btn btn-primary btn-sm">
                    <PlusIcon size={16} />
                    Criar projeto
                  </Link>
                }
              />
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Projeto</th>
                      <th>Cliente</th>
                      <th>Estado</th>
                      <th className="mono" style={{ textAlign: 'right' }}>
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.active_projects.map((p) => (
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
