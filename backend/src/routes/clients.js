import { Router } from 'express';
import { prisma } from '../prisma/prismaClient.js';
import { requireAuth } from '../middleware/auth.js';
import { clientToApi, parseId } from '../lib/apiShape.js';

const router = Router();
router.use(requireAuth);

router.get('/', async (_req, res) => {
  const rows = await prisma.client.findMany({ orderBy: { name: 'asc' } });
  res.json(rows.map(clientToApi));
});

router.post('/', async (req, res) => {
  const { name, email, phone } = req.body || {};
  if (!name || !String(name).trim()) {
    return res.status(400).json({ error: 'Nome é obrigatório' });
  }
  const row = await prisma.client.create({
    data: {
      name: String(name).trim(),
      email: email || null,
      phone: phone || null,
    },
  });
  res.status(201).json(clientToApi(row));
});

router.get('/:id', async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'ID inválido' });
  const row = await prisma.client.findUnique({ where: { id } });
  if (!row) return res.status(404).json({ error: 'Cliente não encontrado' });
  res.json(clientToApi(row));
});

router.put('/:id', async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'ID inválido' });
  const { name, email, phone } = req.body || {};
  if (!name || !String(name).trim()) {
    return res.status(400).json({ error: 'Nome é obrigatório' });
  }
  try {
    const row = await prisma.client.update({
      where: { id },
      data: {
        name: String(name).trim(),
        email: email || null,
        phone: phone || null,
      },
    });
    res.json(clientToApi(row));
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ error: 'Cliente não encontrado' });
    throw e;
  }
});

router.delete('/:id', async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'ID inválido' });
  try {
    await prisma.client.delete({ where: { id } });
    res.status(204).send();
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ error: 'Cliente não encontrado' });
    throw e;
  }
});

export default router;
