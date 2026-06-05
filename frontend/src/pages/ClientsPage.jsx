import { useEffect, useState } from 'react';
import { api } from '../api.js';

export default function ClientsPage() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '' });

  async function load() {
    setError('');
    try {
      const data = await api('/api/clients');
      setRows(data);
    } catch (e) {
      setError(e.body?.error || e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function startCreate() {
    setEditing('new');
    setForm({ name: '', email: '', phone: '' });
  }

  function startEdit(c) {
    setEditing(String(c.id));
    setForm({ name: c.name, email: c.email || '', phone: c.phone || '' });
  }

  async function saveClient(e) {
    e.preventDefault();
    setError('');
    try {
      if (editing === 'new') {
        const c = await api('/api/clients', { method: 'POST', body: form });
        setRows((r) => [...r, c].sort((a, b) => a.name.localeCompare(b.name)));
      } else {
        const c = await api(`/api/clients/${editing}`, { method: 'PUT', body: form });
        setRows((r) => r.map((x) => (x.id === c.id ? c : x)));
      }
      setEditing(null);
    } catch (err) {
      setError(err.body?.error || err.message);
    }
  }

  async function removeClient(id) {
    if (!window.confirm('Apagar este cliente? Projetos associados serão apagados em cascata.')) return;
    setError('');
    try {
      await api(`/api/clients/${id}`, { method: 'DELETE' });
      setRows((r) => r.filter((x) => x.id !== Number(id)));
      if (editing === String(id)) setEditing(null);
    } catch (err) {
      setError(err.body?.error || err.message);
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '1rem' }}>
        <h1>Clientes</h1>
        <button type="button" className="btn btn-primary" onClick={startCreate}>
          Novo cliente
        </button>
      </div>
      <p></p>
      {error ? <div className="alert alert-error">{error}</div> : null}

      {editing ? (
        <form className="card" onSubmit={saveClient}>
          <h2>{editing === 'new' ? 'Novo cliente' : 'Editar cliente'}</h2>
          <div className="field">
            <label>Nome</label>
            <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
          </div>
          <div className="field">
            <label>Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
          </div>
          <div className="field">
            <label>Telefone</label>
            <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
          </div>
          <button type="submit" className="btn btn-primary">
            Guardar
          </button>{' '}
          <button type="button" className="btn btn-ghost" onClick={() => setEditing(null)}>
            Fechar
          </button>
        </form>
      ) : null}

      {loading ? (
        <p className="muted">A carregar…</p>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrap" style={{ border: 'none' }}>
            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Email</th>
                  <th>Telefone</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => (
                  <tr key={c.id}>
                    <td>{c.name}</td>
                    <td>{c.email || '—'}</td>
                    <td>{c.phone || '—'}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <button type="button" className="btn" onClick={() => startEdit(c)}>
                        Editar
                      </button>{' '}
                      <button type="button" className="btn btn-danger" onClick={() => removeClient(c.id)}>
                        Apagar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
