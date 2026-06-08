import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { ErrorAlert, Spinner } from '../components/ui.jsx';
import { CheckIcon, PlayIcon } from '../components/icons.jsx';

const FEATURES = [
  'Crie clientes e projetos em segundos',
  'Tabelas de orçamento totalmente editáveis',
  'Acesso seguro protegido por JWT',
];

export default function RegisterPage() {
  const { register, enterDemo } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(email, password);
      nav('/', { replace: true });
    } catch (err) {
      setError(err.body?.error || err.message);
    } finally {
      setLoading(false);
    }
  }

  function onDemo() {
    enterDemo();
    nav('/', { replace: true });
  }

  return (
    <div className="auth">
      <div className="auth-hero">
        <div className="brand-row">Gestão de Obras</div>
        <div>
          <h2>Comece a gerir as suas obras hoje mesmo.</h2>
          <p>Crie a sua conta e organize orçamentos, clientes e projetos sem complicações.</p>
          <div style={{ marginTop: '1.6rem' }}>
            {FEATURES.map((f) => (
              <div className="auth-feature" key={f}>
                <span className="tick">
                  <CheckIcon size={15} />
                </span>
                {f}
              </div>
            ))}
          </div>
        </div>
        <p style={{ fontSize: '0.8rem', color: 'var(--faint)' }}>© {new Date().getFullYear()} Gestão de Obras — Construtor</p>
      </div>

      <div className="auth-form-wrap">
        <div className="auth-card">
          <h1>Criar conta</h1>
          <p className="muted" style={{ marginBottom: '1.4rem' }}>
            Demora menos de um minuto.
          </p>
          <ErrorAlert>{error}</ErrorAlert>
          <form onSubmit={onSubmit}>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                autoComplete="username"
                placeholder="nome@empresa.pt"
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
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary btn-block" disabled={loading} style={{ marginTop: '0.4rem' }}>
              {loading ? <Spinner /> : null}
              {loading ? 'A criar…' : 'Registar'}
            </button>
          </form>

          <div className="divider">ou</div>
          <button type="button" className="btn btn-block" onClick={onDemo}>
            <PlayIcon size={16} />
            Ver demonstração
          </button>

          <p className="muted" style={{ marginTop: '1.3rem', textAlign: 'center' }}>
            Já tem conta? <Link to="/login">Iniciar sessão</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
