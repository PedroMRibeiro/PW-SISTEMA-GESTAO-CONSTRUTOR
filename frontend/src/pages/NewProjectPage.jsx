import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';

export default function NewProjectPage() {
  const nav = useNavigate();
  const [clients, setClients] = useState([]);
  const [clientId, setClientId] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [ivaRate, setIvaRate] = useState('23');
  const [profitRate, setProfitRate] = useState('0');
  const [error, setError] = useState('');

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
    }
  }

  return (
    <div style={{ maxWidth: 520 }}>
      <h1>Novo projeto</h1>
      <p className="muted">Cada projeto pertence a um cliente.</p>
      {error ? <div className="alert alert-error">{error}</div> : null}
      <form className="card" onSubmit={onSubmit}>
        <div className="field">
          <label htmlFor="client">Cliente</label>
          <select id="client" value={clientId} onChange={(e) => setClientId(e.target.value)} required>
            {clients.length === 0 ? <option value="">Crie um cliente primeiro</option> : null}
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="name">Nome da obra</label>
          <input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="field">
          <label htmlFor="desc">Descrição</label>
          <textarea id="desc" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="iva">Taxa de IVA (%)</label>
          <input id="iva" type="number" step="0.01" min="0" value={ivaRate} onChange={(e) => setIvaRate(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="profit">Taxa de lucro (%)</label>
          <input
            id="profit"
            type="number"
            step="0.01"
            min="0"
            value={profitRate}
            onChange={(e) => setProfitRate(e.target.value)}
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={!clientId}>
          Criar projeto
        </button>
      </form>
    </div>
  );
}
