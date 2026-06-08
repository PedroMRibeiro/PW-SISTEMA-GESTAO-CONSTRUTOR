import { AlertIcon } from './icons.jsx';

export function fmtEUR(n) {
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(n || 0);
}

export function Spinner({ className = '' }) {
  return <span className={`spinner ${className}`} role="status" aria-label="A carregar" />;
}

export function ErrorAlert({ children }) {
  if (!children) return null;
  return (
    <div className="alert alert-error" role="alert">
      <AlertIcon size={18} />
      <span>{children}</span>
    </div>
  );
}

export function StatCard({ label, value, sub, icon, tone = 'blue' }) {
  return (
    <div className="stat">
      <div className="stat-top">
        <span className="stat-label">{label}</span>
        {icon ? <span className={`stat-icon ${tone}`}>{icon}</span> : null}
      </div>
      <div className="stat-value mono">{value}</div>
      {sub ? <div className="stat-sub">{sub}</div> : null}
    </div>
  );
}

export function EmptyState({ icon, title, message, action }) {
  return (
    <div className="empty">
      {icon ? <div className="empty-icon">{icon}</div> : null}
      <h3>{title}</h3>
      {message ? <p>{message}</p> : null}
      {action ? <div style={{ marginTop: '0.6rem' }}>{action}</div> : null}
    </div>
  );
}

export function TableSkeleton({ rows = 4, cols = 4 }) {
  return (
    <div className="card card-pad-0">
      <div style={{ padding: '0.85rem' }}>
        {Array.from({ length: rows }).map((_, r) => (
          <div
            key={r}
            style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: '1rem', padding: '0.55rem 0' }}
          >
            {Array.from({ length: cols }).map((_, c) => (
              <div key={c} className="skeleton" style={{ height: 16, width: c === 0 ? '70%' : '50%' }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function CardsSkeleton({ count = 2 }) {
  return (
    <div className="stat-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="stat">
          <div className="skeleton" style={{ height: 14, width: '40%', marginBottom: '1rem' }} />
          <div className="skeleton" style={{ height: 30, width: '60%' }} />
        </div>
      ))}
    </div>
  );
}
