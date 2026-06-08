import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { ErrorAlert, Spinner } from '../components/ui.jsx';
import { ArrowLeftIcon, PlusIcon } from '../components/icons.jsx';

export default function NewProjectPage() {
  const nav = useNavigate();
  const [clients, setClients] = useState([]);
  const [clientId, setClientId] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [ivaRate, setIvaRate] = useState('23');
  const [profitRate, setProfitRate] = useState('0');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const c = await api('/api/clients');
        if (!cancelled) {
          setClients(c);
          if (c[0]) setClientId(String(c[0].id));
        }
      } catch (e) {
        if (!cancelled) setError(e.body?.error || e.message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const p = await api('/api/projects', {
        method: 'POST',
        body: {
          client_id: Number(clientId),
          name,
          description,
          iva_rate: Number(ivaRate),
          profit_rate: Number(profitRate),
        },
      });
      nav(`/projetos/${p.id}`, { replace: true });
    } catch (err) {
      setError(err.body?.error || err.message);
      setSaving(false);
    }
  }

  const noClients = clients.length === 0;

  return (
    <div style={{ maxWidth: 640 }}>
      <Link to="/projetos" className="btn btn-ghost btn-sm" style={{ marginBottom: '0.9rem' }}>
        <ArrowLeftIcon size={16} />
        Voltar aos projetos
      </Link>
      <div className="page-head">
        <div>
          <h1>Novo projeto</h1>
          <p className="subtitle">Cada projeto pertence a um cliente e tem a sua taxa de IVA e lucro.</p>
        </div>
      </div>

      <ErrorAlert>{error}</ErrorAlert>

      {noClients ? (
        <div className="alert alert-error" style={{ background: 'var(--warning-soft)', borderColor: 'rgba(245,183,61,0.35)', color: '#f5cf7a' }}>
          <span>
            Ainda não tem clientes. <Link to="/clientes">Crie um cliente</Link> antes de adicionar um projeto.
          </span>
        </div>
      ) : null}

      <form className="card" onSubmit={onSubmit}>
        <div className="field">
          <label htmlFor="client">Cliente</label>
          <select id="client" value={clientId} onChange={(e) => setClientId(e.target.value)} required>
            {noClients ? <option value="">Crie um cliente primeiro</option> : null}
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="name">Nome da obra</label>
          <input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Remodelação T3 — Av. da Liberdade" required />
        </div>
        <div className="field">
          <label htmlFor="desc">Descrição</label>
          <textarea id="desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Notas e âmbito do trabalho (opcional)" />
        </div>
        <div className="grid2">
          <div className="field">
            <label htmlFor="iva">Taxa de IVA (%)</label>
            <input id="iva" type="number" step="0.01" min="0" value={ivaRate} onChange={(e) => setIvaRate(e.target.value)} className="mono" />
          </div>
          <div className="field">
            <label htmlFor="profit">Taxa de lucro (%)</label>
            <input id="profit" type="number" step="0.01" min="0" value={profitRate} onChange={(e) => setProfitRate(e.target.value)} className="mono" />
          </div>
        </div>
        <button type="submit" className="btn btn-primary" disabled={!clientId || saving} style={{ marginTop: '0.4rem' }}>
          {saving ? <Spinner /> : <PlusIcon size={18} />}
          {saving ? 'A criar…' : 'Criar projeto'}
        </button>
      </form>
    </div>
  );
}
