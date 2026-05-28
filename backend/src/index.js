import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import { prisma } from './prisma/prismaClient.js';
import authRoutes from './routes/auth.js';
import clientsRoutes from './routes/clients.js';
import projectsRoutes from './routes/projects.js';
import budgetLinesRoutes from './routes/budgetLines.js';
import reportsRoutes from './routes/reports.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: process.env.CORS_ORIGIN || true }));
app.use(express.json());

app.get('/api/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true, db: true });
  } catch (e) {
    console.error(e);
    res.status(503).json({ ok: false, db: false, error: 'Base de dados indisponível' });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/clients', clientsRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/projects/:projectId/lines', budgetLinesRoutes);
app.use('/api/reports', reportsRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'JSON inválido no pedido' });
  }
  res.status(500).json({ error: 'Erro interno' });
});

app.listen(PORT, () => {
  console.log(`API a correr em http://localhost:${PORT}`);
});
