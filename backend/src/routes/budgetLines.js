import { Router } from 'express';
import { query } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { computeBudgetTotals } from '../services/budget.js';

const router = Router({ mergeParams: true });
router.use(requireAuth);

async function assertProject(id) {
  const { rows } = await query(
    'SELECT id, iva_rate FROM projects WHERE id = $1',
    [id],
  );
  return rows[0];
}

router.get('/', async (req, res) => {
  const p = await assertProject(req.params.projectId);
  if (!p) return res.status(404).json({ error: 'Projeto não encontrado' });
  const { rows } = await query(
    `SELECT id, project_id, description, quantity, unit_price, display_order
     FROM budget_lines WHERE project_id = $1 ORDER BY display_order ASC, id ASC`,
    [req.params.projectId],
  );
  const totals = computeBudgetTotals(rows, p.iva_rate);
  res.json({ lines: totals.lines, ...totals });
});

router.post('/', async (req, res) => {
  const p = await assertProject(req.params.projectId);
  if (!p) return res.status(404).json({ error: 'Projeto não encontrado' });
  const { description, quantity, unit_price, display_order } = req.body || {};
  if (!description || !String(description).trim()) {
    return res.status(400).json({ error: 'Descrição é obrigatória' });
  }
  const q = quantity != null ? Number(quantity) : 1;
  const up = unit_price != null ? Number(unit_price) : 0;
  if (!Number.isFinite(q) || q < 0 || !Number.isFinite(up) || up < 0) {
    return res.status(400).json({ error: 'Quantidade e preço unitário devem ser números válidos' });
  }
  const ord =
    display_order != null
      ? Number(display_order)
      : (await query('SELECT COALESCE(MAX(display_order), -1) + 1 AS n FROM budget_lines WHERE project_id = $1', [req.params.projectId])).rows[0].n;

  const { rows } = await query(
    `INSERT INTO budget_lines (project_id, description, quantity, unit_price, display_order)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, project_id, description, quantity, unit_price, display_order`,
    [req.params.projectId, String(description).trim(), q, up, ord],
  );
  await query('UPDATE projects SET updated_at = NOW() WHERE id = $1', [req.params.projectId]);
  const all = (
    await query(
      `SELECT id, project_id, description, quantity, unit_price, display_order
       FROM budget_lines WHERE project_id = $1 ORDER BY display_order ASC, id ASC`,
      [req.params.projectId],
    )
  ).rows;
  const totals = computeBudgetTotals(all, p.iva_rate);
  res.status(201).json({ line: rows[0], ...totals });
});

router.put('/:lineId', async (req, res) => {
  const p = await assertProject(req.params.projectId);
  if (!p) return res.status(404).json({ error: 'Projeto não encontrado' });
  const { description, quantity, unit_price, display_order } = req.body || {};
  if (!description || !String(description).trim()) {
    return res.status(400).json({ error: 'Descrição é obrigatória' });
  }
  const qn = Number(quantity);
  const upn = Number(unit_price);
  if (!Number.isFinite(qn) || qn < 0 || !Number.isFinite(upn) || upn < 0) {
    return res.status(400).json({ error: 'Quantidade e preço unitário devem ser números válidos' });
  }
  const { rows } = await query(
    `UPDATE budget_lines SET
       description = $1,
       quantity = $2,
       unit_price = $3,
       display_order = COALESCE($4, display_order)
     WHERE id = $5 AND project_id = $6
     RETURNING id, project_id, description, quantity, unit_price, display_order`,
    [
      String(description).trim(),
      qn,
      upn,
      display_order != null ? Number(display_order) : null,
      req.params.lineId,
      req.params.projectId,
    ],
  );
  if (!rows[0]) return res.status(404).json({ error: 'Linha não encontrada' });
  await query('UPDATE projects SET updated_at = NOW() WHERE id = $1', [req.params.projectId]);
  const all = (
    await query(
      `SELECT id, project_id, description, quantity, unit_price, display_order
       FROM budget_lines WHERE project_id = $1 ORDER BY display_order ASC, id ASC`,
      [req.params.projectId],
    )
  ).rows;
  const totals = computeBudgetTotals(all, p.iva_rate);
  res.json({ line: rows[0], ...totals });
});

router.delete('/:lineId', async (req, res) => {
  const p = await assertProject(req.params.projectId);
  if (!p) return res.status(404).json({ error: 'Projeto não encontrado' });
  const { rowCount } = await query(
    'DELETE FROM budget_lines WHERE id = $1 AND project_id = $2',
    [req.params.lineId, req.params.projectId],
  );
  if (!rowCount) return res.status(404).json({ error: 'Linha não encontrada' });
  await query('UPDATE projects SET updated_at = NOW() WHERE id = $1', [req.params.projectId]);
  const all = (
    await query(
      `SELECT id, project_id, description, quantity, unit_price, display_order
       FROM budget_lines WHERE project_id = $1 ORDER BY display_order ASC, id ASC`,
      [req.params.projectId],
    )
  ).rows;
  const totals = computeBudgetTotals(all, p.iva_rate);
  res.json(totals);
});

export default router;
