# Sistema de gestão de orçamentos e obras (construtor)

Stack: **Node.js**, **Express**, **Prisma**, **React (Vite)**, **JWT**, **PostgreSQL**.

## Requisitos

- Node.js 18+
- PostgreSQL 14+

## Base de dados (Prisma)

1. Crie uma base de dados (ex.: `gestao_construtor`).
2. Configure `DATABASE_URL` em `backend/.env` (ver `backend/.env.example`).
3. Aplique o esquema:

```bash
cd backend
npm install
npx prisma migrate dev
```

Se preferir sincronizar sem ficheiros de migração (ambiente local):

```bash
npx prisma db push
```

O modelo está em `backend/prisma/schema.prisma`. O ficheiro `backend/sql/schema.sql` mantém-se apenas como referência histórica.

## Backend

```bash
cd backend
copy .env.example .env
```

Edite `.env` e defina `DATABASE_URL` e `JWT_SECRET`.

```bash
npm install
npm run dev
```

API por omissão: `http://localhost:4000` (`GET /api/health` — inclui teste à BD).

Outros comandos úteis:

- `npm run db:studio` — interface visual Prisma Studio
- `npm run db:migrate` — criar/aplicar migrações

## Frontend

```bash
cd frontend
npm install
npm run dev
```

Interface: `http://localhost:5173` (proxy de `/api` para o backend).

## Fluxo sugerido

1. Registo / login (`/registo`, `/login`).
2. Criar **clientes**.
3. Criar **projetos** (cada projeto pertence a um cliente).
4. Editar **linhas de orçamento** no detalhe do projeto; o servidor calcula **subtotal**, **IVA** e **total**.
5. Consultar **painel** e **relatório por estado**.

## Estados do projeto

`orcamento`, `aprovada`, `em_curso`, `concluida`, `cancelada` (alteração com confirmação na interface).
