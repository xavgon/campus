# CAMPUS — Documentação técnica

Documentação versionada do estado actual do código (junho 2026). Complementa o [README.md](./README.md) e o [roadmap do frontend](./client/FRONTEND_ROADMAP.md).

> A pasta `docs/` no repositório está no `.gitignore` (documentação local do grupo). Usa este ficheiro e os READMEs como referência no Git.

---

## Arquitectura

```
Browser / Electron
       │
       ▼
  client/ (React + Vite)
       │  axios → /api/*
       ▼
  server/ (Express 5)
       │
       ▼
  PostgreSQL (users, podcasts, streams, logs, categories)
```

### Papéis de utilizador

| `users.role` | Descrição |
|--------------|-----------|
| `user` | Utilizador normal (defeito) |
| `admin` | Acesso a `/api/admin/*` e rotas `/admin` no cliente |

O middleware `requireAdmin` valida o papel na base de dados (não só no JWT).

---

## API — Autenticação

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| POST | `/auth/register` | — | Criar conta |
| POST | `/auth/login` | — | Login → `{ token, user }` |
| GET | `/auth/profile` | Bearer | Perfil do utilizador autenticado |
| POST | `/auth/forgot-password` | — | Pedido de reset (genérico) |

Resposta de sucesso: `{ success, message, data }`.

---

## API — Presença (utilizadores ligados)

Sessão activa = heartbeat nos últimos **90 segundos**.

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| POST | `/presence/heartbeat` | Bearer | Marca utilizador como ligado |
| POST | `/presence/leave` | Bearer | Remove da lista (logout / sair da app) |
| GET | `/presence/online` | Bearer | `{ count, users[] }` |

Implementação: memória no processo Node (`presence.service.ts`). Reiniciar o servidor zera a lista.

O cliente envia heartbeat a cada **25 s** em `MainLayout` (`usePresenceSession`). O dashboard consulta `/presence/online` a cada **12 s**.

---

## API — Administração

Todas as rotas exigem **Bearer token** + `role = admin`.

### Resumo

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/admin/overview` | Métricas: users, podcasts, streams, online, live |
| GET | `/admin/categories` | Lista categorias para formulários |
| GET | `/admin/logs` | Últimas acções administrativas |
| GET | `/admin/users` | Listar utilizadores |
| PATCH | `/admin/users/:id` | `{ nome?, role? }` |
| DELETE | `/admin/users/:id` | Eliminar conta |
| GET | `/admin/podcasts` | Listar publicações |
| POST | `/admin/podcasts` | Criar metadados `{ title, description?, category_id?, user_id }` |
| PATCH | `/admin/podcasts/:id` | Editar metadados |
| DELETE | `/admin/podcasts/:id` | Remover |
| GET | `/admin/streams` | Listar transmissões |
| POST | `/admin/streams` | Criar `{ title, description?, status?, host_user_id?, scheduled_at? }` |
| PATCH | `/admin/streams/:id` | Editar (incl. `status`) |
| DELETE | `/admin/streams/:id` | Eliminar |

Acções de escrita registam entrada em `logs` (ex.: «Publicação criada: …»).

### Regras de negócio (admin)

- A conta `admin@campus.co.ao` não pode ser eliminada nem rebaixada a `user`.
- O admin não pode remover o próprio papel `admin` nem eliminar a própria conta pelo painel.

---

## Modelo de dados (extensões recentes)

### `users`

| Coluna | Tipo | Notas |
|--------|------|-------|
| `role` | `VARCHAR(20)` | `user` \| `admin`, default `user` |

### `streams`

| Coluna | Tipo | Notas |
|--------|------|-------|
| `status` | `VARCHAR(20)` | `scheduled`, `live`, `ended` |
| `host_user_id` | UUID FK | Opcional |
| `scheduled_at` | TIMESTAMPTZ | Opcional |

### `logs`

| Coluna | Tipo | Notas |
|--------|------|-------|
| `user_id` | UUID | Admin que executou a acção |
| `action` | VARCHAR(80) | Texto descritivo |

### Categorias

Seed idempotente em `ensureSchemaPatches`: Educação geral, Ciências, História, Línguas, Tecnologia, Artes.

---

## Frontend — Módulos (`client/src/features/`)

| Feature | Responsabilidade |
|---------|------------------|
| `auth/` | Login, registo, contexto, `ProtectedRoute` |
| `dashboard/` | Hub, stats, episódios recentes, atalho admin |
| `podcasts/` | Biblioteca, publicar, validação, demo até API |
| `profile/` | Perfil, avatar, forms (API Módulo 6 pendente) |
| `presence/` | Heartbeat e snapshot de ligados |
| `admin/` | Painel completo CRUD + logs |

### Navegação autenticada

- Itens: Dashboard, Podcasts, Publicar, Perfil.
- **Admin** (só `role === admin`): link para `/admin`.
- Zona de utilizador: avatar, nome (destaque «CAMPUS»), botão Sair.

---

## Variáveis de ambiente

### `server/.env`

| Variável | Exemplo |
|----------|---------|
| `DATABASE_URL` | `postgresql://...` |
| `JWT_SECRET` | string segura |
| `JWT_EXPIRES_IN` | `7d` |
| `PORT` | `3001` |
| `CLIENT_URL` | `http://localhost:5173` |

### `client/.env`

| Variável | Exemplo |
|----------|---------|
| `VITE_API_URL` | `http://localhost:3001/api` |

---

## Pendências alinhadas aos módulos

| Módulo | Backend | Frontend |
|--------|---------|----------|
| 2 Podcasts | `POST` multipart, listagem real | Substituir `DEMO_PODCASTS`, progress upload |
| 3 Compressão | FFmpeg, estados | Badges na biblioteca |
| 4 Streaming | `GET /stream/:id` | Player |
| 6 Perfil | `PUT` perfil/password | Gravar forms do perfil |
| Reset email | Token + SMTP | Rota `/reset-password` |

---

## Changelog recente (resumo)

- Dashboard com boas-vindas, stats, episódios recentes, painel «ligados agora».
- Biblioteca `/podcasts` com grelha, filtros, pesquisa, opção «Outros» na publicação.
- Presença em tempo real (heartbeat + API).
- Painel admin completo: utilizadores, publicações, transmissões, registo.
- Nav com `NavUserMenu`, papel `admin`, migrações automáticas em dev.

---

*Atualizar este ficheiro quando alterares contratos de API ou rotas públicas.*
