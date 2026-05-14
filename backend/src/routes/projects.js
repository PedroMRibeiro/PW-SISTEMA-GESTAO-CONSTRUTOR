import { Router } from 'express';
import { query } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { computeBudgetTotals } from '../services/budget.js';

const router = Router();
router.use(requireAuth);

const STATUSES = ['orcamento', 'aprovada', 'em_curso', 'concluida', 'cancelada'];

async function fetchLines(projectId) {
  const { rows } = await query(
    `SELECT id, project_id, description, quantity, unit_price, display_order
     FROM budget_lines WHERE project_id = $1 ORDER BY display_order ASC, id ASC`,
    [projectId],
  );
  return rows;
}

async function projectWithBudget(projectRow) {
  const lines = await fetchLines(projectRow.id);
  const totals = computeBudgetTotals(lines, projectRow.iva_rate);
  return {
    ...projectRow,
    budget_lines: totals.lines,
    budget: {
      subtotal: totals.subtotal,
      iva_rate: totals.iva_rate,
      iva_amount: totals.iva_amount,
      total: totals.total,
    },
  };
}

router.get('/', async (_req, res) => {
  const { rows } = await query(
    `SELECT p.id, p.client_id, p.name, p.description, p.status, p.iva_rate, p.created_at, p.updated_at,
            c.name AS client_name
     FROM projects p
     JOIN clients c ON c.id = p.client_id
     ORDER BY p.updated_at DESC`,
  );
  const out = [];
  for (const row of rows) {
    const lines = await fetchLines(row.id);
    const totals = computeBudgetTotals(lines, row.iva_rate);
    out.push({
      ...row,
      budget_total: totals.total,
    });
  }
  res.json(out);
});

router.post('/', async (req, res) => {
  const { client_id, name, description, status, iva_rate } = req.body || {};
  if (!client_id || !name || !String(name).trim()) {
    return res.status(400).json({ error: 'client_id e name são obrigatórios' });
  }
  if (status && !STATUSES.includes(status)) {
    return res.status(400).json({ error: 'Estado inválido' });
  }
  const rate = iva_rate != null ? Number(iva_rate) : 23;
  const { rows } = await query(
    `INSERT INTO projects (client_id, name, description, status, iva_rate)
     VALUES ($1, $2, $3, COALESCE($4::project_status, 'orcamento'::project_status), $5)
     RETURNING id, client_id, name, description, status, iva_rate, created_at, updated_at`,
    [client_id, String(name).trim(), description || null, status || null, rate],
  );
  const full = await projectWithBudget(rows[0]);
  res.status(201).json(full);
});

router.get('/:id', async (req, res) => {
  const { rows } = await query(
    `SELECT p.id, p.client_id, p.name, p.description, p.status, p.iva_rate, p.created_at, p.updated_at,
            c.name AS client_name
     FROM projects p
     JOIN clients c ON c.id = p.client_id
     WHERE p.id = $1`,
    [req.params.id],
  );
  if (!rows[0]) return res.status(404).json({ error: 'Projeto não encontrado' });
  const full = await projectWithBudget(rows[0]);
  res.json(full);
});

router.put('/:id', async (req, res) => {
  const { name, description, iva_rate } = req.body || {};
  if (!name || !String(name).trim()) {
    return res.status(400).json({ error: 'name é obrigatório' });
  }
  const rate = iva_rate != null ? Number(iva_rate) : undefined;
  const { rows } = await query(
    `UPDATE projects SET
       name = $1,
       description = $2,
       iva_rate = COALESCE($3, iva_rate),
       updated_at = NOW()
     WHERE id = $4
     RETURNING id, client_id, name, description, status, iva_rate, created_at, updated_at`,
    [String(name).trim(), description ?? null, rate ?? null, req.params.id],
  );
  if (!rows[0]) return res.status(404).json({ error: 'Projeto não encontrado' });
  const { rows: c } = await query('SELECT name AS client_name FROM clients WHERE id = $1', [
    rows[0].client_id,
  ]);
  const full = await projectWithBudget({ ...rows[0], client_name: c[0]?.client_name });
  res.json(full);
});

router.patch('/:id/status', async (req, res) => {
  const { status } = req.body || {};
  if (!status || !STATUSES.includes(status)) {
    return res.status(400).json({ error: 'Estado inválido' });
  }
  const { rows } = await query(
    `UPDATE projects SET status = $1::project_status, updated_at = NOW()
     WHERE id = $2
     RETURNING id, client_id, name, description, status, iva_rate, created_at, updated_at`,
    [status, req.params.id],
  );
  if (!rows[0]) return res.status(404).json({ error: 'Projeto não encontrado' });
  const { rows: c } = await query('SELECT name AS client_name FROM clients WHERE id = $1', [
    rows[0].client_id,
  ]);
  const full = await projectWithBudget({ ...rows[0], client_name: c[0]?.client_name });
  res.json(full);
});

router.delete('/:id', async (req, res) => {
  const { rowCount } = await query('DELETE FROM projects WHERE id = $1', [req.params.id]);
  if (!rowCount) return res.status(404).json({ error: 'Projeto não encontrado' });
  res.status(204).send();
});

export default router;
