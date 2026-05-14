import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function RegisterPage() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      await register(email, password);
      nav('/', { replace: true });
    } catch (err) {
      setError(err.body?.error || err.message);
    }
  }

  return (
    <div className="layout" style={{ maxWidth: 420 }}>
      <h1>Criar conta</h1>
      <p className="muted">Acesso à API protegido por JWT</p>
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
          <label htmlFor="password">Palavra-passe (mín. 6)</label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
          />
        </div>
        <button type="submit" className="btn btn-primary">
          Registar
        </button>
        <p className="muted" style={{ marginTop: '1rem' }}>
          Já tem conta? <Link to="/login">Iniciar sessão</Link>
        </p>
      </form>
    </div>
  );
}
