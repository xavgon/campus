# CAMPUS — Documentação técnica

Documentação versionada do estado actual do código (junho 2026). Complementa o [README.md](./README.md) e o [roadmap do frontend](./client/FRONTEND_ROADMAP.md).

> A pasta `docs/` no repositório está no `.gitignore` (documentação local do grupo). Usa este ficheiro e os READMEs como referência no Git.

---

## Arquitectura

```
Browser / Electron
       │
       ├── axios → /api/*
       └── WebSocket → ws://host/live
       │
       ▼
  client/ (React + Vite)
       │
       ▼
  server/ (Express 5 + ws)
       │
       ├── PostgreSQL (users, podcasts, streams, logs, categories)
       └── Memória (presença, sessões live WebSocket)
```

### Papéis de utilizador

| `users.role` | Descrição |
|--------------|-----------|
| `user` | Utilizador normal (defeito) — ouvir, explorar, assistir live |
| `creator` | Pode publicar podcasts (`POST /api/podcasts`) e transmitir (`/live/broadcast`) |
| `admin` | Acesso a `/api/admin/*`, rotas `/admin` no cliente; também pode publicar e transmitir |

O middleware `requireAdmin` valida o papel na base de dados (não só no JWT).  
O middleware `requireCreator` exige `creator` ou `admin` para publicação e broadcast.

---

## CORS

Configuração em `server/src/config/cors.ts`:

- **Desenvolvimento:** aceita qualquer origem `http(s)://localhost` ou `127.0.0.1` em qualquer porta (ex.: Vite em `5173` ou `5174`).
- **Produção:** apenas `CLIENT_URL` definido no `.env` do servidor.
- `credentials: true` — cookies/headers de autorização permitidos.

---

## API — Autenticação

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| POST | `/auth/register` | — | Criar conta |
| POST | `/auth/login` | — | Login → `{ token, user }` |
| GET | `/auth/profile` | Bearer | Perfil do utilizador autenticado |
| POST | `/auth/forgot-password` | — | Gera token de reset (em dev, link no log do servidor) |
| POST | `/auth/reset-password` | — | `{ token, newPassword }` — define nova password |

Resposta de sucesso: `{ success, message, data }`.

O link de reset aponta para `{CLIENT_URL}/reset-password?token=…`.

---

## API — Podcasts

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/podcasts` | Bearer | Listagem — query `search`, `category_id` |
| GET | `/podcasts/:id` | Bearer | Detalhe de um episódio |
| POST | `/podcasts` | Bearer + criador | Upload multipart (áudio + capa opcional) |
| DELETE | `/podcasts/:id` | Bearer | Dono do podcast ou admin |
| GET | `/podcasts/:id/download` | Bearer | Download do ficheiro de áudio |

Ficheiros servidos em `/uploads/…` (estático no Express).

---

## API — Streaming de áudio (ficheiros)

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/stream/:id` | Bearer ou `?token=` | Stream do áudio comprimido (suporta `<audio src>`) |

Middleware `requireStreamAuth` — token no header `Authorization` ou query string.

---

## Live — WebSocket (tempo real)

Sessões **em memória** no processo Node — independentes da tabela `streams` do admin.

### REST

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/live` | Bearer | `{ sessions[], total }` — transmissões activas |

### WebSocket

- **Path:** `ws://localhost:3001/live`
- **Query:** `token` (JWT), `role` (`broadcaster` \| `listener`), `liveId` (obrigatório para listener)
- **Implementação:** `server/src/live/live.gateway.ts` (pacote `ws`)

#### Fluxo broadcaster

1. Cliente abre WS com `role=broadcaster` e envia mensagem JSON `{ type: 'start', title, mediaType }`.
2. Servidor cria sessão com UUID, responde `{ type: 'started', liveId }`.
3. Cliente envia frames binários (áudio/vídeo); servidor reencaminha aos listeners.
4. Ao desligar, sessão é removida da memória.

#### Fluxo listener

1. Cliente abre WS com `role=listener&liveId=…`.
2. Servidor confirma `{ type: 'joined', … }` e reencaminha frames do broadcaster.
3. Se a sessão não existir, ligação é fechada.

#### Tipos de média

`audio`, `video` ou `both` — definidos pelo broadcaster no `start`.

### Página de teste (dev)

`GET /live-test` — `server/live-test.html` (HTML estático para testar WS sem o cliente React).

### Cliente React

Feature `client/src/features/live/`:

| Componente | Função |
|------------|--------|
| `LiveHubPage` | Lista sessões via `GET /api/live` |
| `LiveBroadcastPage` | Captura câmara/microfone, WS broadcaster |
| `LiveWatchPage` | WS listener + reprodução |
| `useActiveLives` | Polling da lista de sessões |
| `buildLiveWebSocketUrl` | Constrói URL WS a partir de `VITE_API_URL` |

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
| PATCH | `/admin/users/:id` | `{ nome?, role? }` — papéis: `user`, `creator`, `admin` |
| DELETE | `/admin/users/:id` | Eliminar conta |
| GET | `/admin/podcasts` | Listar publicações |
| POST | `/admin/podcasts` | Criar metadados `{ title, description?, category_id?, user_id }` |
| PATCH | `/admin/podcasts/:id` | Editar metadados |
| DELETE | `/admin/podcasts/:id` | Remover |
| GET | `/admin/streams` | Listar transmissões (BD) |
| POST | `/admin/streams` | Criar `{ title, description?, status?, host_user_id?, scheduled_at? }` |
| PATCH | `/admin/streams/:id` | Editar (incl. `status`) |
| DELETE | `/admin/streams/:id` | Eliminar |

Acções de escrita registam entrada em `logs` (ex.: «Publicação criada: …»).

### Regras de negócio (admin)

- A conta `admin@campus.co.ao` não pode ser eliminada nem rebaixada a `user`.
- O admin não pode remover o próprio papel `admin` nem eliminar a própria conta pelo painel.

### Admin `streams` vs live WebSocket

| | Admin `streams` (BD) | Live WebSocket |
|--|---------------------|----------------|
| Persistência | PostgreSQL | Memória (reinício apaga) |
| UI admin | `/admin/transmissions` | — |
| UI utilizador | — | `/live`, `/live/broadcast`, `/live/:id` |
| Estado actual | CRUD de metadados | Broadcast funcional (Passo 1) |

Unificação futura: ligar criação de `streams` na BD ao gateway WebSocket.

---

## Modelo de dados (extensões recentes)

### `users`

| Coluna | Tipo | Notas |
|--------|------|-------|
| `role` | `VARCHAR(20)` | `user` \| `creator` \| `admin`, default `user` |

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
| `auth/` | Login, registo, reset password, contexto, `ProtectedRoute`, `CreatorRoute` |
| `dashboard/` | Hub, stats, episódios recentes, atalho admin e live |
| `podcasts/` | Biblioteca (API + debounce), publicar, detalhe, player, download |
| `profile/` | Perfil, avatar, forms |
| `presence/` | Heartbeat e snapshot de ligados |
| `live/` | Hub, broadcast, watch — WebSocket + MediaDevices |
| `admin/` | Painel completo CRUD + logs |

### Navegação autenticada

- Itens base: Dashboard, Podcasts, Ao vivo, Perfil.
- **Publicar** (só `creator` ou `admin`): link para `/podcasts/new`.
- **Admin** (só `role === admin`): link para `/admin`.
- Zona de utilizador: avatar, nome (destaque «CAMPUS»), botão Sair.

### Electron

- `ElectronShell` + `DesktopTitleBar` — barra de título personalizada (minimizar, maximizar, fechar).
- `ElectronRootRedirect` — `/` → `/login` ou `/dashboard`.
- Menu nativo oculto em produção; em dev, menu mínimo (Alt para revelar).
- `electron:dev` — Vite `:5173` `--strictPort` + Electron.

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

A URL WebSocket é derivada de `VITE_API_URL` (`http` → `ws`, sem `/api`).

---

## Pendências alinhadas aos módulos

| Módulo | Backend | Frontend |
|--------|---------|----------|
| 3 Compressão | FFmpeg, estados de processamento | Badges na biblioteca |
| 4 Streaming | Melhorias CDN/range | Player avançado (seek, mini-player) |
| 6 Perfil | `PUT` perfil/password | Gravar forms do perfil |
| Reset email | SMTP real (hoje: log em dev) | ✅ rota `/reset-password` |
| Live Passo 2 | Unificar com `streams` na BD | Mensagens de erro mais claras |
| Electron | Ícone `.ico` para installer | Smoke test de build |

---

## Changelog recente (resumo)

- Papel `creator` (RF12) — publicar podcasts e transmitir ao vivo.
- Reset password — `POST /auth/reset-password` + página `/reset-password`.
- Biblioteca de podcasts ligada à API com pesquisa debounced (RF09).
- Upload multipart e streaming de áudio (`/api/podcasts`, `/api/stream/:id`).
- Live WebSocket — gateway, REST `GET /api/live`, UI hub/broadcast/watch.
- CORS em dev — qualquer porta localhost (corrige login quando Vite usa 5174).
- Electron — janela frameless, barra de título CAMPUS, redirect na raiz.
- Dashboard com boas-vindas, stats, episódios recentes, painel «ligados agora».
- Painel admin completo: utilizadores (com papel criador), publicações, transmissões, registo.

---

*Atualizar este ficheiro quando alterares contratos de API ou rotas públicas.*
