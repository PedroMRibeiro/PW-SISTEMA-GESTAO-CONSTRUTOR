import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../prisma/prismaClient.js';
import { signToken } from '../middleware/auth.js';
import { userToApi } from '../lib/apiShape.js';

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
    const user = await prisma.user.create({
      data: {
        email: String(email).toLowerCase().trim(),
        passwordHash: hash,
      },
    });
    const token = signToken({ sub: user.id, email: user.email });
    return res.status(201).json({ user: userToApi(user), token });
  } catch (e) {
    if (e.code === 'P2002') {
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
    const user = await prisma.user.findUnique({
      where: { email: String(email).toLowerCase().trim() },
    });
    if (!user || !(await bcrypt.compare(String(password), user.passwordHash))) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }
    const token = signToken({ sub: user.id, email: user.email });
    return res.json({ user: userToApi(user), token });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Erro no login' });
  }
});

export default router;
