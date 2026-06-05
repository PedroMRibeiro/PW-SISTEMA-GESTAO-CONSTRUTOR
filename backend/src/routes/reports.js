import { Router } from 'express';
import { prisma } from '../prisma/prismaClient.js';
import { requireAuth } from '../middleware/auth.js';
import { computeBudgetTotals } from '../services/budget.js';
function linesForTotals(budgetLines) {
  return budgetLines.map((l) => ({
    quantity: Number(l.quantity),
    unit_price: Number(l.unitPrice),
  }));
}

const router = Router();
router.use(requireAuth);

router.get('/by-status', async (_req, res) => {
  const projects = await prisma.project.findMany({
    select: {
      id: true,
      name: true,
      status: true,
      ivaRate: true,
      profitRate: true,
      budgetLines: { select: { quantity: true, unitPrice: true } },
    },
  });

  const byStatus = {
    orcamento: { count: 0, total_billing: 0, total_profit: 0, projects: [] },
    aprovada: { count: 0, total_billing: 0, total_profit: 0, projects: [] },
    em_curso: { count: 0, total_billing: 0, total_profit: 0, projects: [] },
    concluida: { count: 0, total_billing: 0, total_profit: 0, projects: [] },
    cancelada: { count: 0, total_billing: 0, total_profit: 0, projects: [] },
  };

  for (const p of projects) {
    const totals = computeBudgetTotals(linesForTotals(p.budgetLines), p.ivaRate, p.profitRate);
    const bucket = byStatus[p.status];
    bucket.count += 1;
    bucket.total_billing += totals.total;
    bucket.total_profit += totals.profit_amount;
    bucket.projects.push({
      id: p.id,
      name: p.name,
      subtotal: totals.subtotal,
      total: totals.total,
      profit_rate: totals.profit_rate,
      profit_amount: totals.profit_amount,
    });
  }

  for (const k of Object.keys(byStatus)) {
    byStatus[k].total_billing = Math.round((byStatus[k].total_billing + Number.EPSILON) * 100) / 100;
    byStatus[k].total_profit = Math.round((byStatus[k].total_profit + Number.EPSILON) * 100) / 100;
  }

  const grandTotal = Object.entries(byStatus)
    .filter(([status]) => status !== 'cancelada')
    .reduce((s, [, b]) => s + b.total_billing, 0);
  const grandProfit = Object.entries(byStatus)
    .filter(([status]) => status !== 'cancelada')
    .reduce((s, [, b]) => s + b.total_profit, 0);

  res.json({
    by_status: byStatus,
    grand_total_billing: Math.round((grandTotal + Number.EPSILON) * 100) / 100,
    grand_total_profit: Math.round((grandProfit + Number.EPSILON) * 100) / 100,
  });
});

router.get('/dashboard', async (_req, res) => {
  const rows = await prisma.project.findMany({
    where: { status: { notIn: ['cancelada', 'concluida'] } },
    include: {
      client: { select: { name: true } },
      budgetLines: { select: { quantity: true, unitPrice: true } },
    },
  });

  let emCursoTotal = 0;
  const active = [];

  for (const row of rows) {
    const { total } = computeBudgetTotals(linesForTotals(row.budgetLines), row.ivaRate, row.profitRate);
    active.push({
      id: row.id,
      name: row.name,
      status: row.status,
      client_name: row.client.name,
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
