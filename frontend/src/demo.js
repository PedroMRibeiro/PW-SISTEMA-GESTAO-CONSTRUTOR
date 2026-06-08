// ============================================================================
// Modo demonstração (bypass do registo/login).
// Simula a API do backend em memória, para se poder ver o site sem servidor.
// Ativado quando localStorage["gc_demo"] === "1".
// Os dados reiniciam ao recarregar a página.
// ============================================================================
import { computeTotals } from './budgetMath.js';

const DEMO_KEY = 'gc_demo';

export function isDemo() {
  return localStorage.getItem(DEMO_KEY) === '1';
}
export function setDemo(on) {
  if (on) localStorage.setItem(DEMO_KEY, '1');
  else localStorage.removeItem(DEMO_KEY);
}

// ---------------------------------------------------------------------------
// Estado em memória (seed)
// ---------------------------------------------------------------------------
let seq = 100;
const nextId = () => ++seq;

let clients = [
  { id: 1, name: 'Construções Almeida, Lda.', email: 'geral@almeida.pt', phone: '912 345 678', created_at: new Date().toISOString() },
  { id: 2, name: 'Maria Sousa', email: 'maria.sousa@email.pt', phone: '936 111 222', created_at: new Date().toISOString() },
  { id: 3, name: 'Câmara Municipal de Viseu', email: 'obras@cm-viseu.pt', phone: '232 400 500', created_at: new Date().toISOString() },
];

let projects = [
  {
    id: 1,
    client_id: 1,
    name: 'Remodelação T3 — Av. da Liberdade',
    description: 'Remodelação completa de apartamento T3, incluindo cozinha e casas de banho.',
    status: 'em_curso',
    iva_rate: 23,
    profit_rate: 15,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    budget_lines: [
      { id: 11, project_id: 1, description: 'Demolições e remoção de entulho', quantity: 1, unit_price: 1800, display_order: 0 },
      { id: 12, project_id: 1, description: 'Alvenaria e reboco (m²)', quantity: 85, unit_price: 32, display_order: 1 },
      { id: 13, project_id: 1, description: 'Pavimento flutuante (m²)', quantity: 70, unit_price: 28, display_order: 2 },
      { id: 14, project_id: 1, description: 'Mão de obra — canalização', quantity: 40, unit_price: 22, display_order: 3 },
    ],
  },
  {
    id: 2,
    client_id: 2,
    name: 'Construção de moradia — Lote 14',
    description: 'Moradia unifamiliar de raiz, 180m².',
    status: 'aprovada',
    iva_rate: 23,
    profit_rate: 12,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    budget_lines: [
      { id: 21, project_id: 2, description: 'Fundações e estrutura', quantity: 1, unit_price: 42000, display_order: 0 },
      { id: 22, project_id: 2, description: 'Cobertura', quantity: 1, unit_price: 9500, display_order: 1 },
      { id: 23, project_id: 2, description: 'Caixilharia (un.)', quantity: 12, unit_price: 650, display_order: 2 },
    ],
  },
  {
    id: 3,
    client_id: 3,
    name: 'Requalificação de passeio público',
    description: 'Substituição de calçada e mobiliário urbano.',
    status: 'orcamento',
    iva_rate: 6,
    profit_rate: 8,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    budget_lines: [
      { id: 31, project_id: 3, description: 'Calçada portuguesa (m²)', quantity: 320, unit_price: 45, display_order: 0 },
      { id: 32, project_id: 3, description: 'Bancos de jardim (un.)', quantity: 8, unit_price: 220, display_order: 1 },
    ],
  },
  {
    id: 4,
    client_id: 1,
    name: 'Pintura de fachada — Edifício Sol',
    description: '',
    status: 'concluida',
    iva_rate: 23,
    profit_rate: 10,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    budget_lines: [{ id: 41, project_id: 4, description: 'Pintura exterior (m²)', quantity: 540, unit_price: 14, display_order: 0 }],
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function clientName(clientId) {
  return clients.find((c) => c.id === clientId)?.name || '—';
}

function budgetOf(p) {
  const t = computeTotals(p.budget_lines, p.iva_rate, p.profit_rate);
  return {
    subtotal: t.subtotal,
    iva_amount: t.iva_amount,
    profit_amount: t.profit_amount,
    total: t.total,
    iva_rate: t.iva_rate,
    profit_rate: t.profit_rate,
  };
}

function projectDetail(p) {
  return {
    id: p.id,
    client_id: p.client_id,
    client_name: clientName(p.client_id),
    name: p.name,
    description: p.description,
    status: p.status,
    iva_rate: p.iva_rate,
    profit_rate: p.profit_rate,
    created_at: p.created_at,
    updated_at: p.updated_at,
    budget_lines: p.budget_lines,
    budget: budgetOf(p),
  };
}

function lineResponse(p) {
  return { ...budgetOf(p), lines: p.budget_lines };
}

function find(path, re) {
  const m = path.match(re);
  return m ? m.map(Number).slice(1) : null;
}

// ---------------------------------------------------------------------------
// Router da API simulada
// ---------------------------------------------------------------------------
export async function demoApi(path, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const body = options.body && typeof options.body === 'object' ? options.body : {};
  await new Promise((r) => setTimeout(r, 200)); // pequeno atraso para parecer real

  // --- Auth (não deve ser chamado em demo, mas respondemos por segurança) ---
  if (path.startsWith('/api/auth')) {
    return { user: { id: 1, email: 'demo@demo.pt' }, token: 'demo-token' };
  }

  // --- Reports ---
  if (path === '/api/reports/dashboard') {
    const active = projects
      .filter((p) => p.status !== 'cancelada' && p.status !== 'concluida')
      .map((p) => ({ id: p.id, name: p.name, status: p.status, client_name: clientName(p.client_id), budget_total: budgetOf(p).total }));
    const emCurso = projects.filter((p) => p.status === 'em_curso').reduce((s, p) => s + budgetOf(p).total, 0);
    return { active_projects: active, active_count: active.length, em_curso_total: Math.round(emCurso * 100) / 100 };
  }

  if (path === '/api/reports/by-status') {
    const byStatus = {
      orcamento: { count: 0, total_billing: 0, total_profit: 0, projects: [] },
      aprovada: { count: 0, total_billing: 0, total_profit: 0, projects: [] },
      em_curso: { count: 0, total_billing: 0, total_profit: 0, projects: [] },
      concluida: { count: 0, total_billing: 0, total_profit: 0, projects: [] },
      cancelada: { count: 0, total_billing: 0, total_profit: 0, projects: [] },
    };
    for (const p of projects) {
      const b = budgetOf(p);
      const bucket = byStatus[p.status];
      bucket.count += 1;
      bucket.total_billing += b.total;
      bucket.total_profit += b.profit_amount;
      bucket.projects.push({ id: p.id, name: p.name, subtotal: b.subtotal, total: b.total, profit_rate: b.profit_rate, profit_amount: b.profit_amount });
    }
    for (const k of Object.keys(byStatus)) {
      byStatus[k].total_billing = Math.round(byStatus[k].total_billing * 100) / 100;
      byStatus[k].total_profit = Math.round(byStatus[k].total_profit * 100) / 100;
    }
    const grand = Object.entries(byStatus).filter(([s]) => s !== 'cancelada');
    return {
      by_status: byStatus,
      grand_total_billing: Math.round(grand.reduce((s, [, b]) => s + b.total_billing, 0) * 100) / 100,
      grand_total_profit: Math.round(grand.reduce((s, [, b]) => s + b.total_profit, 0) * 100) / 100,
    };
  }

  // --- Clients ---
  if (path === '/api/clients' && method === 'GET') {
    return [...clients].sort((a, b) => a.name.localeCompare(b.name));
  }
  if (path === '/api/clients' && method === 'POST') {
    const c = { id: nextId(), name: body.name, email: body.email || null, phone: body.phone || null, created_at: new Date().toISOString() };
    clients.push(c);
    return c;
  }
  {
    const ids = find(path, /^\/api\/clients\/(\d+)$/);
    if (ids) {
      const [cid] = ids;
      if (method === 'PUT') {
        const c = clients.find((x) => x.id === cid);
        if (c) Object.assign(c, { name: body.name, email: body.email || null, phone: body.phone || null });
        return c;
      }
      if (method === 'DELETE') {
        clients = clients.filter((x) => x.id !== cid);
        projects = projects.filter((p) => p.client_id !== cid);
        return {};
      }
    }
  }

  // --- Projects ---
  if (path === '/api/projects' && method === 'GET') {
    return projects.map((p) => ({ id: p.id, name: p.name, status: p.status, client_name: clientName(p.client_id), budget_total: budgetOf(p).total }));
  }
  if (path === '/api/projects' && method === 'POST') {
    const p = {
      id: nextId(),
      client_id: Number(body.client_id),
      name: body.name,
      description: body.description || '',
      status: 'orcamento',
      iva_rate: Number(body.iva_rate) || 0,
      profit_rate: Number(body.profit_rate) || 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      budget_lines: [],
    };
    projects.push(p);
    return projectDetail(p);
  }
  {
    const ids = find(path, /^\/api\/projects\/(\d+)$/);
    if (ids) {
      const p = projects.find((x) => x.id === ids[0]);
      if (method === 'GET') return p ? projectDetail(p) : Promise.reject(notFound());
      if (method === 'PUT') {
        if (p) Object.assign(p, { name: body.name, description: body.description || '', iva_rate: Number(body.iva_rate) || 0, profit_rate: Number(body.profit_rate) || 0, updated_at: new Date().toISOString() });
        return projectDetail(p);
      }
      if (method === 'DELETE') {
        projects = projects.filter((x) => x.id !== ids[0]);
        return {};
      }
    }
  }
  {
    const ids = find(path, /^\/api\/projects\/(\d+)\/status$/);
    if (ids && method === 'PATCH') {
      const p = projects.find((x) => x.id === ids[0]);
      if (p) p.status = body.status;
      return projectDetail(p);
    }
  }
  {
    const ids = find(path, /^\/api\/projects\/(\d+)\/lines$/);
    if (ids && method === 'POST') {
      const p = projects.find((x) => x.id === ids[0]);
      if (p) {
        p.budget_lines.push({
          id: nextId(),
          project_id: p.id,
          description: body.description,
          quantity: Number(body.quantity) || 0,
          unit_price: Number(body.unit_price) || 0,
          display_order: p.budget_lines.length,
        });
      }
      return lineResponse(p);
    }
  }
  {
    const ids = find(path, /^\/api\/projects\/(\d+)\/lines\/(\d+)$/);
    if (ids) {
      const [pid, lineId] = ids;
      const p = projects.find((x) => x.id === pid);
      if (p && method === 'PUT') {
        const l = p.budget_lines.find((x) => x.id === lineId);
        if (l) Object.assign(l, { description: body.description, quantity: Number(body.quantity) || 0, unit_price: Number(body.unit_price) || 0 });
        return lineResponse(p);
      }
      if (p && method === 'DELETE') {
        p.budget_lines = p.budget_lines.filter((x) => x.id !== lineId);
        return lineResponse(p);
      }
    }
  }

  return Promise.reject(notFound());
}

function notFound() {
  const err = new Error('Recurso não encontrado (demo)');
  err.status = 404;
  err.body = { error: 'Recurso não encontrado (demo)' };
  return err;
}
