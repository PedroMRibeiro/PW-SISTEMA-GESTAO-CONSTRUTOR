import { Router } from 'express';
import { query } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/', async (_req, res) => {
  const { rows } = await query(
    'SELECT id, name, email, phone, created_at FROM clients ORDER BY name ASC',
  );
  res.json(rows);
});

router.post('/', async (req, res) => {
  const { name, email, phone } = req.body || {};
  if (!name || !String(name).trim()) {
    return res.status(400).json({ error: 'Nome é obrigatório' });
  }
  const { rows } = await query(
    'INSERT INTO clients (name, email, phone) VALUES ($1, $2, $3) RETURNING id, name, email, phone, created_at',
    [String(name).trim(), email || null, phone || null],
  );
  res.status(201).json(rows[0]);
});

router.get('/:id', async (req, res) => {
  const { rows } = await query(
    'SELECT id, name, email, phone, created_at FROM clients WHERE id = $1',
    [req.params.id],
  );
  if (!rows[0]) return res.status(404).json({ error: 'Cliente não encontrado' });
  res.json(rows[0]);
});

router.put('/:id', async (req, res) => {
  const { name, email, phone } = req.body || {};
  if (!name || !String(name).trim()) {
    return res.status(400).json({ error: 'Nome é obrigatório' });
  }
  const { rows } = await query(
    'UPDATE clients SET name = $1, email = $2, phone = $3 WHERE id = $4 RETURNING id, name, email, phone, created_at',
    [String(name).trim(), email || null, phone || null, req.params.id],
  );
  if (!rows[0]) return res.status(404).json({ error: 'Cliente não encontrado' });
  res.json(rows[0]);
});

router.delete('/:id', async (req, res) => {
  const { rowCount } = await query('DELETE FROM clients WHERE id = $1', [req.params.id]);
  if (!rowCount) return res.status(404).json({ error: 'Cliente não encontrado' });
  res.status(204).send();
});

export default router;
