# CAMPUS — API (servidor)

API **Express 5 + TypeScript + PostgreSQL + WebSocket (`ws`)** para a plataforma CAMPUS.

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
| `CLIENT_URL` | CORS em produção — ex. `http://localhost:5173` |

Em **desenvolvimento**, o CORS aceita qualquer porta `localhost` / `127.0.0.1` (ver `src/config/cors.ts`).

## Scripts

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Desenvolvimento (`tsx watch`) — API + WebSocket `/live` |
| `npm run build` | Compilar para `dist/` |
| `npm run start` | Produção |
| `npm run typecheck` | Verificar TypeScript |
| `npm run db:migrate` | Aplicar `schema.sql` |
| `npm run db:seed` | Patches + conta admin |

## Arranque em desenvolvimento

Com `DATABASE_URL` definido e `NODE_ENV !== production`:

1. `ensureSchemaPatches()` — coluna `users.role`, tabela `streams`, categorias
2. `ensureDefaultAdmin()` — `admin@campus.co.ao` / `Campus123`

O servidor HTTP e o gateway WebSocket partilham a mesma porta (`attachLiveGateway`).

## Endpoints e serviços

| Prefixo | Ficheiro | Notas |
|---------|----------|-------|
| `/api/health` | `routes/health.routes.ts` | Estado da API e BD |
| `/api/auth` | `routes/auth.routes.ts` | Registo, login, perfil, forgot/reset password |
| `/api/podcasts` | `routes/podcast.routes.ts` | CRUD + upload; `POST` exige `requireCreator` |
| `/api/stream` | `routes/stream.routes.ts` | Stream de áudio (`?token=` suportado) |
| `/api/live` | `routes/live.routes.ts` | Sessões WebSocket activas (memória) |
| `/api/presence` | `routes/presence.routes.ts` | Heartbeat, online |
| `/api/admin` | `routes/admin.routes.ts` | CRUD admin |
| `ws://host/live` | `live/live.gateway.ts` | Broadcast e listeners em tempo real |
| `/live-test` | `live-test.html` | Página de teste (só dev) |
| `/uploads` | estático | Ficheiros de podcasts |

Documentação completa: [DOCUMENTATION.md](../DOCUMENTATION.md).

## Middleware relevante

| Middleware | Uso |
|------------|-----|
| `requireAuth` | JWT válido |
| `requireAdmin` | `role = admin` (validado na BD) |
| `requireCreator` | `role = creator` ou `admin` |
| `requireStreamAuth` | Token no header ou query (player) |
| `uploadPodcast` | Multipart para `POST /api/podcasts` |

## Papéis (`users.role`)

| Valor | Permissões extra |
|-------|------------------|
| `user` | Consumir conteúdo, assistir live |
| `creator` | Publicar podcasts, transmitir ao vivo |
| `admin` | Painel admin + permissões de criador |

## Estrutura `src/`

```
src/
├── app.ts              # Express + HTTP server + live gateway
├── config/             # env, cors
├── controllers/
├── database/           # schema.sql, migrate, seed, patches
├── live/               # live.gateway.ts (WebSocket)
├── middleware/         # auth, requireAdmin, requireCreator, upload…
├── models/             # user, podcast, stream, log, category
├── routes/
├── services/
├── streaming/          # stream.controller (áudio)
├── types/              # roles.ts
└── utils/
```

## Conta admin

| Email | Password |
|-------|----------|
| `admin@campus.co.ao` | `Campus123` |

Papel `admin` na coluna `users.role`. Após alterar papéis na BD, o utilizador deve voltar a fazer login para o JWT reflectir o novo papel.

## Live vs admin streams

- **`GET /api/live`** — sessões WebSocket activas (memória; reinício do servidor apaga).
- **`/api/admin/streams`** — metadados persistidos em PostgreSQL (agendamento, estados).

Estes dois sistemas ainda não estão ligados entre si.
