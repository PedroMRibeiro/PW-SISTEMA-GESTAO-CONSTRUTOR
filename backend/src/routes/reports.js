import { Router } from 'express';
import { query } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { computeBudgetTotals } from '../services/budget.js';

const router = Router();
router.use(requireAuth);

router.get('/by-status', async (_req, res) => {
  const { rows: projects } = await query(
    `SELECT p.id, p.name, p.status, p.iva_rate
     FROM projects p`,
  );

  const byStatus = {
    orcamento: { count: 0, total_billing: 0, projects: [] },
    aprovada: { count: 0, total_billing: 0, projects: [] },
    em_curso: { count: 0, total_billing: 0, projects: [] },
    concluida: { count: 0, total_billing: 0, projects: [] },
    cancelada: { count: 0, total_billing: 0, projects: [] },
  };

  for (const p of projects) {
    const { rows: lines } = await query(
      'SELECT quantity, unit_price FROM budget_lines WHERE project_id = $1',
      [p.id],
    );
    const { total } = computeBudgetTotals(lines, p.iva_rate);
    const bucket = byStatus[p.status];
    bucket.count += 1;
    bucket.total_billing += total;
    bucket.projects.push({ id: p.id, name: p.name, total });
  }

  for (const k of Object.keys(byStatus)) {
    byStatus[k].total_billing = Math.round((byStatus[k].total_billing + Number.EPSILON) * 100) / 100;
  }

  const grandTotal = Object.values(byStatus).reduce((s, b) => s + b.total_billing, 0);

  res.json({
    by_status: byStatus,
    grand_total_billing: Math.round((grandTotal + Number.EPSILON) * 100) / 100,
  });
});

router.get('/dashboard', async (_req, res) => {
  const { rows } = await query(
    `SELECT p.id, p.name, p.status, p.iva_rate, c.name AS client_name
     FROM projects p
     JOIN clients c ON c.id = p.client_id
     WHERE p.status NOT IN ('cancelada', 'concluida')`,
  );

  let emCursoTotal = 0;
  const active = [];

  for (const row of rows) {
    const { rows: lines } = await query(
      'SELECT quantity, unit_price FROM budget_lines WHERE project_id = $1',
      [row.id],
    );
    const { total } = computeBudgetTotals(lines, row.iva_rate);
    active.push({
      id: row.id,
      name: row.name,
      status: row.status,
      client_name: row.client_name,
      budget_total: total,
    });
    if (row.status === 'em_curso') {
      emCursoTotal += total;
    }
  }

  res.json({
    active_projects: active,
    active_count: active.length,
    em_curso_total: Math.round((emCursoTotal + Number.EPSILON) * 100) / 100,
  });
});

export default router;
