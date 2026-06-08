import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { ErrorAlert, EmptyState, TableSkeleton } from '../components/ui.jsx';
import { PlusIcon, ClientsIcon, EditIcon, TrashIcon, CloseIcon } from '../components/icons.jsx';

export default function ClientsPage() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
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

  useEffect(() => {
    if (!editing) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setEditing(null);
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [editing]);

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
    setSaving(true);
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
    } finally {
      setSaving(false);
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
      <div className="page-head">
        <div>
          <h1>Clientes</h1>
          <p className="subtitle">A sua carteira de clientes. Cada projeto pertence a um cliente.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={startCreate}>
          <PlusIcon size={18} />
          Novo cliente
        </button>
      </div>

      <ErrorAlert>{error}</ErrorAlert>

      {loading ? (
        <TableSkeleton rows={4} cols={4} />
      ) : rows.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<ClientsIcon size={26} />}
            title="Sem clientes"
            message="Adicione o primeiro cliente para poder criar projetos."
            action={
              <button type="button" className="btn btn-primary btn-sm" onClick={startCreate}>
                <PlusIcon size={16} />
                Adicionar cliente
              </button>
            }
          />
        </div>
      ) : (
        <div className="card card-pad-0">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Email</th>
                  <th>Telefone</th>
                  <th style={{ width: 1 }} />
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => (
                  <tr key={c.id}>
                    <td className="link-strong">{c.name}</td>
                    <td className="muted">{c.email || '—'}</td>
                    <td className="muted">{c.phone || '—'}</td>
                    <td>
                      <div className="cell-actions">
                        <button type="button" className="btn btn-sm btn-icon" title="Editar" aria-label="Editar" onClick={() => startEdit(c)}>
                          <EditIcon size={16} />
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger btn-sm btn-icon"
                          title="Apagar"
                          aria-label="Apagar"
                          onClick={() => removeClient(c.id)}
                        >
                          <TrashIcon size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {editing ? (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setEditing(null)}>
          <div className="modal" role="dialog" aria-modal="true" onMouseDown={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0 }}>{editing === 'new' ? 'Novo cliente' : 'Editar cliente'}</h2>
              <button type="button" className="btn btn-ghost btn-icon" aria-label="Fechar" onClick={() => setEditing(null)}>
                <CloseIcon size={18} />
              </button>
            </div>
            <form onSubmit={saveClient} style={{ marginTop: '1rem' }}>
              <div className="field">
                <label>Nome</label>
                <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required autoFocus />
              </div>
              <div className="field">
                <label>Email</label>
                <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
              </div>
              <div className="field">
                <label>Telefone</label>
                <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setEditing(null)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'A guardar…' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
