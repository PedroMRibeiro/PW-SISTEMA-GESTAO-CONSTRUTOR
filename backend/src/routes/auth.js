import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../db.js';
import { signToken } from '../middleware/auth.js';

const router = Router();

router.post('/register', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Email e palavra-passe são obrigatórios' });
  }
  if (String(password).length < 6) {
    return res.status(400).json({ error: 'Palavra-passe deve ter pelo menos 6 caracteres' });
  }
  try {
    const hash = await bcrypt.hash(String(password), 10);
    const { rows } = await query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, created_at',
      [String(email).toLowerCase().trim(), hash],
    );
    const user = rows[0];
    const token = signToken({ sub: user.id, email: user.email });
    return res.status(201).json({ user: { id: user.id, email: user.email }, token });
  } catch (e) {
    if (e.code === '23505') {
      return res.status(409).json({ error: 'Email já registado' });
    }
    console.error(e);
    return res.status(500).json({ error: 'Erro ao criar conta' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Email e palavra-passe são obrigatórios' });
  }
  try {
    const { rows } = await query('SELECT id, email, password_hash FROM users WHERE email = $1', [
      String(email).toLowerCase().trim(),
    ]);
    const user = rows[0];
    if (!user || !(await bcrypt.compare(String(password), user.password_hash))) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }
    const token = signToken({ sub: user.id, email: user.email });
    return res.json({ user: { id: user.id, email: user.email }, token });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Erro no login' });
  }
});

export default router;
