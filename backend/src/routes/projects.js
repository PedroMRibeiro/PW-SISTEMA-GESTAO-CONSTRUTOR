import { Router } from 'express';
import { prisma } from '../prisma/prismaClient.js';
import { requireAuth } from '../middleware/auth.js';
import { computeBudgetTotals } from '../services/budget.js';
import { budgetLineToApi, parseId, projectToApi } from '../lib/apiShape.js';

const router = Router();
router.use(requireAuth);

const STATUSES = ['orcamento', 'aprovada', 'em_curso', 'concluida', 'cancelada'];

const lineOrder = [{ displayOrder: 'asc' }, { id: 'asc' }];

async function fetchLines(projectId) {
  const rows = await prisma.budgetLine.findMany({
    where: { projectId },
    orderBy: lineOrder,
  });
  return rows.map(budgetLineToApi);
}

async function projectWithBudget(projectRow, clientName) {
  const lines = await fetchLines(projectRow.id);
  const totals = computeBudgetTotals(lines, projectRow.ivaRate, projectRow.profitRate);
  return {
    ...projectToApi(projectRow, clientName),
    budget_lines: totals.lines,
    budget: {
      subtotal: totals.subtotal,
      iva_rate: totals.iva_rate,
      profit_rate: totals.profit_rate,
      iva_amount: totals.iva_amount,
      profit_amount: totals.profit_amount,
      total: totals.total,
    },
  };
}

router.get('/', async (_req, res) => {
  const rows = await prisma.project.findMany({
    include: { client: true },
    orderBy: { updatedAt: 'desc' },
  });
  const out = [];
  for (const row of rows) {
    const lines = await fetchLines(row.id);
    const totals = computeBudgetTotals(lines, row.ivaRate, row.profitRate);
    out.push({
      ...projectToApi(row, row.client.name),
      budget_total: totals.total,
    });
  }
  res.json(out);
});

router.post('/', async (req, res) => {
  const { client_id, name, description, status, iva_rate, profit_rate } = req.body || {};
  if (!client_id || !name || !String(name).trim()) {
    return res.status(400).json({ error: 'client_id e name são obrigatórios' });
  }
  if (status && !STATUSES.includes(status)) {
    return res.status(400).json({ error: 'Estado inválido' });
  }
  const rate = iva_rate != null ? Number(iva_rate) : 23;
  const profitRate = profit_rate != null ? Number(profit_rate) : 0;
  const row = await prisma.project.create({
    data: {
      clientId: Number(client_id),
      name: String(name).trim(),
      description: description || null,
      status: status || 'orcamento',
      ivaRate: rate,
      profitRate,
    },
  });
  const full = await projectWithBudget(row);
  res.status(201).json(full);
});

router.get('/:id', async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'ID inválido' });
  const row = await prisma.project.findUnique({
    where: { id },
    include: { client: true },
  });
  if (!row) return res.status(404).json({ error: 'Projeto não encontrado' });
  const full = await projectWithBudget(row, row.client.name);
  res.json(full);
});

router.put('/:id', async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'ID inválido' });
  const { name, description, iva_rate, profit_rate } = req.body || {};
  if (!name || !String(name).trim()) {
    return res.status(400).json({ error: 'name é obrigatório' });
  }
  try {
    const row = await prisma.project.update({
      where: { id },
      data: {
        name: String(name).trim(),
        description: description ?? null,
        ...(iva_rate != null ? { ivaRate: Number(iva_rate) } : {}),
        ...(profit_rate != null ? { profitRate: Number(profit_rate) } : {}),
      },
      include: { client: true },
    });
    const full = await projectWithBudget(row, row.client.name);
    res.json(full);
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ error: 'Projeto não encontrado' });
    throw e;
  }
});

router.patch('/:id/status', async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'ID inválido' });
  const { status } = req.body || {};
  if (!status || !STATUSES.includes(status)) {
    return res.status(400).json({ error: 'Estado inválido' });
  }
  try {
    const row = await prisma.project.update({
      where: { id },
      data: { status },
      include: { client: true },
    });
    const full = await projectWithBudget(row, row.client.name);
    res.json(full);
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ error: 'Projeto não encontrado' });
    throw e;
  }
});

router.delete('/:id', async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'ID inválido' });
  try {
    await prisma.project.delete({ where: { id } });
    res.status(204).send();
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ error: 'Projeto não encontrado' });
    throw e;
  }
});

export default router;
