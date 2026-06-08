import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { ErrorAlert, Spinner } from '../components/ui.jsx';
import { CheckIcon, PlayIcon } from '../components/icons.jsx';

const FEATURES = [
  'Orçamentos com IVA e margem de lucro automáticos',
  'Acompanhamento de obras por estado',
  'Relatórios de faturação e lucro do construtor',
];

export default function LoginPage() {
  const { login, enterDemo } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      nav(loc.state?.from?.pathname || '/', { replace: true });
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
          <h2>A sua obra, do orçamento à entrega, num só lugar.</h2>
          <p>Plataforma de gestão de orçamentos e obras para construtores.</p>
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
          <h1>Iniciar sessão</h1>
          <p className="muted" style={{ marginBottom: '1.4rem' }}>
            Bem-vindo de volta. Introduza os seus dados.
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
              <label htmlFor="password">Palavra-passe</label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary btn-block" disabled={loading} style={{ marginTop: '0.4rem' }}>
              {loading ? <Spinner /> : null}
              {loading ? 'A entrar…' : 'Entrar'}
            </button>
          </form>

          <div className="divider">ou</div>
          <button type="button" className="btn btn-block" onClick={onDemo}>
            <PlayIcon size={16} />
            Ver demonstração
          </button>

          <p className="muted" style={{ marginTop: '1.3rem', textAlign: 'center' }}>
            Sem conta? <Link to="/registo">Criar registo</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
