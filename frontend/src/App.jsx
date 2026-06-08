import { useState } from 'react';
import { NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import { getToken } from './api.js';
import { isDemo } from './demo.js';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import ProjectsPage from './pages/ProjectsPage.jsx';
import ProjectDetailPage from './pages/ProjectDetailPage.jsx';
import NewProjectPage from './pages/NewProjectPage.jsx';
import ClientsPage from './pages/ClientsPage.jsx';
import ReportPage from './pages/ReportPage.jsx';
import {
  DashboardIcon,
  ProjectsIcon,
  ClientsIcon,
  ReportIcon,
  LogoutIcon,
  MenuIcon,
} from './components/icons.jsx';

const NAV = [
  { to: '/', label: 'Painel', icon: DashboardIcon, end: true },
  { to: '/projetos', label: 'Projetos', icon: ProjectsIcon },
  { to: '/clientes', label: 'Clientes', icon: ClientsIcon },
  { to: '/relatorio', label: 'Relatório', icon: ReportIcon },
];

const CRUMBS = {
  '/': { title: 'Painel', sub: 'Visão geral' },
  '/projetos': { title: 'Projetos', sub: 'Obras e orçamentos' },
  '/projetos/novo': { title: 'Novo projeto', sub: 'Projetos' },
  '/clientes': { title: 'Clientes', sub: 'Carteira' },
  '/relatorio': { title: 'Relatório', sub: 'Análise' },
};

function initials(email) {
  if (!email) return '?';
  return email.slice(0, 2).toUpperCase();
}

function PrivateLayout({ children }) {
  const { logout, user } = useAuth();
  const loc = useLocation();
  const [open, setOpen] = useState(false);

  if (!getToken()) {
    return <Navigate to="/login" replace state={{ from: loc }} />;
  }

  const crumb =
    CRUMBS[loc.pathname] ||
    (loc.pathname.startsWith('/projetos/') ? { title: 'Detalhe do projeto', sub: 'Projetos' } : { title: '', sub: '' });

  return (
    <div className="app-shell">
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <span>
            <span className="title" style={{ display: 'block' }}>
              Gestão de Obras
            </span>
            <span className="subtitle">Construtor</span>
          </span>
        </div>

        <div className="nav-section">Menu</div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
          {NAV.map(({ to, label, icon: IconC, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setOpen(false)}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <IconC size={19} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-chip">
            <span className="avatar">{initials(user?.email)}</span>
            <span style={{ minWidth: 0 }}>
              <span className="email" style={{ display: 'block' }}>
                {user?.email || 'Sessão ativa'}
              </span>
            </span>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-block"
            onClick={logout}
            style={{ marginTop: '0.4rem', justifyContent: 'flex-start' }}
          >
            <LogoutIcon size={18} />
            Terminar sessão
          </button>
        </div>
      </aside>

      <div className={`scrim ${open ? 'show' : ''}`} onClick={() => setOpen(false)} />

      <div className="main">
        <header className="topbar">
          <button type="button" className="menu-btn" onClick={() => setOpen((v) => !v)} aria-label="Menu">
            <MenuIcon size={20} />
          </button>
          <div className="crumb">
            {crumb.sub ? <span className="crumb-sub">{crumb.sub} / </span> : null}
            {crumb.title}
          </div>
          {isDemo() ? <span className="demo-pill">Modo demonstração</span> : null}
        </header>
        <div className="page">{children}</div>
      </div>
    </div>
  );
}

function Private({ element }) {
  return <PrivateLayout>{element}</PrivateLayout>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/registo" element={<RegisterPage />} />
      <Route path="/" element={<Private element={<DashboardPage />} />} />
      <Route path="/projetos" element={<Private element={<ProjectsPage />} />} />
      <Route path="/projetos/novo" element={<Private element={<NewProjectPage />} />} />
      <Route path="/projetos/:id" element={<Private element={<ProjectDetailPage />} />} />
      <Route path="/clientes" element={<Private element={<ClientsPage />} />} />
      <Route path="/relatorio" element={<Private element={<ReportPage />} />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
