# CAMPUS — API (servidor)

API **Express 5 + TypeScript + PostgreSQL** para a plataforma CAMPUS.

## Configuração

```bash
cp .env.example .env
npm install
npm run db:migrate
npm run dev
```

| Variável | Descrição |
|----------|-----------|
| `DATABASE_URL` | Connection string PostgreSQL |
| `JWT_SECRET` | Segredo para tokens |
| `JWT_EXPIRES_IN` | Ex.: `7d` |
| `PORT` | Default `3001` |
| `CLIENT_URL` | CORS — ex. `http://localhost:5173` |

## Scripts

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Desenvolvimento (`tsx watch`) |
| `npm run build` | Compilar para `dist/` |
| `npm run start` | Produção |
| `npm run typecheck` | Verificar TypeScript |
| `npm run db:migrate` | Aplicar `schema.sql` |
| `npm run db:seed` | Patches + conta admin |

## Arranque em desenvolvimento

Com `DATABASE_URL` definido e `NODE_ENV !== production`:

1. `ensureSchemaPatches()` — coluna `users.role`, tabela `streams`, categorias
2. `ensureDefaultAdmin()` — `admin@campus.co.ao` / `Campus123`

## Rotas montadas

| Prefixo | Ficheiro |
|---------|----------|
| `/api/health` | `routes/health.routes.ts` |
| `/api/auth` | `routes/auth.routes.ts` |
| `/api/presence` | `routes/presence.routes.ts` |
| `/api/admin` | `routes/admin.routes.ts` |

Documentação completa: [DOCUMENTATION.md](../DOCUMENTATION.md).

## Estrutura `src/`

```
src/
├── app.ts
├── config/
├── controllers/
├── database/       # schema.sql, migrate, seed, patches
├── middleware/     # auth, requireAdmin, errors
├── models/         # user, podcast, stream, log, category
├── routes/
├── services/
└── types/
```

## Conta admin

| Email | Password |
|-------|----------|
| `admin@campus.co.ao` | `Campus123` |

Papel `admin` na coluna `users.role`.
