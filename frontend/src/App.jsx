import { NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import { getToken } from './api.js';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import ProjectsPage from './pages/ProjectsPage.jsx';
import ProjectDetailPage from './pages/ProjectDetailPage.jsx';
import NewProjectPage from './pages/NewProjectPage.jsx';
import ClientsPage from './pages/ClientsPage.jsx';
import ReportPage from './pages/ReportPage.jsx';

function PrivateLayout({ children }) {
  const { logout, user } = useAuth();
  const loc = useLocation();
  if (!getToken()) {
    return <Navigate to="/login" replace state={{ from: loc }} />;
  }
  return (
    <div className="layout">
      <header className="topbar">
        <div className="brand">Gestão de obras</div>
        <nav className="nav">
          <NavLink end to="/" className={({ isActive }) => (isActive ? 'active' : '')}>
            Painel
          </NavLink>
          <NavLink to="/projetos" className={({ isActive }) => (isActive ? 'active' : '')}>
            Projetos
          </NavLink>
          <NavLink to="/clientes" className={({ isActive }) => (isActive ? 'active' : '')}>
            Clientes
          </NavLink>
          <NavLink to="/relatorio" className={({ isActive }) => (isActive ? 'active' : '')}>
            Relatório
          </NavLink>
          <span className="muted">{user?.email}</span>
          <button type="button" className="btn btn-ghost" onClick={logout}>
            Sair
          </button>
        </nav>
      </header>
      {children}
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/registo" element={<RegisterPage />} />
      <Route
        path="/"
        element={
          <PrivateLayout>
            <DashboardPage />
          </PrivateLayout>
        }
      />
      <Route
        path="/projetos"
        element={
          <PrivateLayout>
            <ProjectsPage />
          </PrivateLayout>
        }
      />
      <Route
        path="/projetos/novo"
        element={
          <PrivateLayout>
            <NewProjectPage />
          </PrivateLayout>
        }
      />
      <Route
        path="/projetos/:id"
        element={
          <PrivateLayout>
            <ProjectDetailPage />
          </PrivateLayout>
        }
      />
      <Route
        path="/clientes"
        element={
          <PrivateLayout>
            <ClientsPage />
          </PrivateLayout>
        }
      />
      <Route
        path="/relatorio"
        element={
          <PrivateLayout>
            <ReportPage />
          </PrivateLayout>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
