import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function LoginPage() {
  const { login } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      nav(loc.state?.from?.pathname || '/', { replace: true });
    } catch (err) {
      setError(err.body?.error || err.message);
    }
  }

  return (
    <div className="layout" style={{ maxWidth: 420 }}>
      <h1>Iniciar sessão</h1>
      <p className="muted">Sistema de gestão de orçamentos e obras</p>
      {error ? <div className="alert alert-error">{error}</div> : null}
      <form className="card" onSubmit={onSubmit}>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="password">Palavra-passe</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn btn-primary">
          Entrar
        </button>
        <p className="muted" style={{ marginTop: '1rem' }}>
          Sem conta? <Link to="/registo">Criar registo</Link>
        </p>
      </form>
    </div>
  );
}
