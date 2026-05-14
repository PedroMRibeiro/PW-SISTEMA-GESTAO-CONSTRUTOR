# Sistema de gestão de orçamentos e obras (construtor)

Stack: **Node.js**, **Express**, **React (Vite)**, **JWT**, **PostgreSQL**.

## Requisitos

- Node.js 18+
- PostgreSQL 14+

## Base de dados

1. Crie uma base de dados (ex.: `gestao_construtor`).
2. Aplique o esquema:

```bash
psql "$DATABASE_URL" -f backend/sql/schema.sql
```

(Em Windows, use o `psql` do PostgreSQL ou pgAdmin para executar o ficheiro `backend/sql/schema.sql`.)

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

API por omissão: `http://localhost:4000` (`GET /api/health`).

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
