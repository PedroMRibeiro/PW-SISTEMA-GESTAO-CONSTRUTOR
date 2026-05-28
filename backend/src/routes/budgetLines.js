import { Router } from 'express';
import { prisma } from '../prisma/prismaClient.js';
import { requireAuth } from '../middleware/auth.js';
import { computeBudgetTotals } from '../services/budget.js';
import { budgetLineToApi, parseId } from '../lib/apiShape.js';

const router = Router({ mergeParams: true });
router.use(requireAuth);

const lineOrder = [{ displayOrder: 'asc' }, { id: 'asc' }];

async function assertProject(id) {
  const projectId = parseId(id);
  if (!projectId) return null;
  return prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, ivaRate: true },
  });
}

async function linesForProject(projectId) {
  const rows = await prisma.budgetLine.findMany({
    where: { projectId },
    orderBy: lineOrder,
  });
  return rows.map(budgetLineToApi);
}

async function totalsForProject(projectId, ivaRate) {
  const lines = await linesForProject(projectId);
  return computeBudgetTotals(lines, ivaRate);
}

router.get('/', async (req, res) => {
  const p = await assertProject(req.params.projectId);
  if (!p) return res.status(404).json({ error: 'Projeto não encontrado' });
  const totals = await totalsForProject(p.id, p.ivaRate);
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
  let ord = display_order != null ? Number(display_order) : null;
  if (ord == null || !Number.isFinite(ord)) {
    const agg = await prisma.budgetLine.aggregate({
      where: { projectId: p.id },
      _max: { displayOrder: true },
    });
    ord = (agg._max.displayOrder ?? -1) + 1;
  }

  const line = await prisma.budgetLine.create({
    data: {
      projectId: p.id,
      description: String(description).trim(),
      quantity: q,
      unitPrice: up,
      displayOrder: ord,
    },
  });
  await prisma.project.update({
    where: { id: p.id },
    data: { updatedAt: new Date() },
  });
  const totals = await totalsForProject(p.id, p.ivaRate);
  res.status(201).json({ line: budgetLineToApi(line), ...totals });
});

router.put('/:lineId', async (req, res) => {
  const p = await assertProject(req.params.projectId);
  if (!p) return res.status(404).json({ error: 'Projeto não encontrado' });
  const lineId = parseId(req.params.lineId);
  if (!lineId) return res.status(400).json({ error: 'ID de linha inválido' });
  const { description, quantity, unit_price, display_order } = req.body || {};
  if (!description || !String(description).trim()) {
    return res.status(400).json({ error: 'Descrição é obrigatória' });
  }
  const qn = Number(quantity);
  const upn = Number(unit_price);
  if (!Number.isFinite(qn) || qn < 0 || !Number.isFinite(upn) || upn < 0) {
    return res.status(400).json({ error: 'Quantidade e preço unitário devem ser números válidos' });
  }
  const existing = await prisma.budgetLine.findFirst({
    where: { id: lineId, projectId: p.id },
  });
  if (!existing) return res.status(404).json({ error: 'Linha não encontrada' });

  try {
    const line = await prisma.budgetLine.update({
      where: { id: lineId },
      data: {
        description: String(description).trim(),
        quantity: qn,
        unitPrice: upn,
        ...(display_order != null ? { displayOrder: Number(display_order) } : {}),
      },
    });
    await prisma.project.update({
      where: { id: p.id },
      data: { updatedAt: new Date() },
    });
    const totals = await totalsForProject(p.id, p.ivaRate);
    res.json({ line: budgetLineToApi(line), ...totals });
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ error: 'Linha não encontrada' });
    throw e;
  }
});

router.delete('/:lineId', async (req, res) => {
  const p = await assertProject(req.params.projectId);
  if (!p) return res.status(404).json({ error: 'Projeto não encontrado' });
  const lineId = parseId(req.params.lineId);
  if (!lineId) return res.status(400).json({ error: 'ID de linha inválido' });
  const existing = await prisma.budgetLine.findFirst({
    where: { id: lineId, projectId: p.id },
  });
  if (!existing) return res.status(404).json({ error: 'Linha não encontrada' });

  try {
    await prisma.budgetLine.delete({ where: { id: lineId } });
    await prisma.project.update({
      where: { id: p.id },
      data: { updatedAt: new Date() },
    });
    const totals = await totalsForProject(p.id, p.ivaRate);
    res.json(totals);
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ error: 'Linha não encontrada' });
    throw e;
  }
});

export default router;
