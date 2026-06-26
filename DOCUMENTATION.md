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
| `admin` | Acesso a `/api/admin/*` e rotas `/admin` no cliente; **não** publica podcasts nem transmite live |

O middleware `requireAdmin` valida o papel na base de dados (não só no JWT).  
O middleware `requireCreator` exige papel `creator` para publicação e broadcast (Task 9).

---

## CORS

Configuração em `server/src/config/cors.ts`:

- **Desenvolvimento:** aceita qualquer origem `http(s)://localhost` ou `127.0.0.1` em qualquer porta (ex.: Vite em `5173` ou `5174`).
- **Produção:** apenas `CLIENT_URL` definido no `.env` do servidor.
- `credentials: true` — cookies/headers de autorização permitidos.

---

## API — Índice REST (RF14)

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/` | mTLS | Metadados da API, envelope JSON, grupos de recursos e WebSocket |

Resposta inclui `version`, `baseUrl`, `envelope`, `authentication` e `resources[]` com métodos HTTP documentados.

Envelope padrão em todas as rotas JSON:

```json
{ "success": true, "message": "…", "data": { } }
{ "success": false, "message": "…", "data": null }
```

---

## API — Autenticação

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| POST | `/auth/register` | — | Criar conta |
| POST | `/auth/login` | — | Login → `{ token, user }` |
| GET | `/auth/profile` | Bearer | Perfil do utilizador autenticado |
| GET | `/auth/activity` | Bearer | Últimas acções do utilizador (RF02/RF13) |
| PUT | `/auth/profile` | Bearer | Actualizar nome |
| PUT | `/auth/profile/photo` | Bearer | Upload foto (`multipart`, campo `photo`, máx. 5 MB) |
| DELETE | `/auth/profile/photo` | Bearer | Remover foto de perfil |
| PUT | `/auth/password` | Bearer | Alterar password |
| POST | `/auth/forgot-password` | — | Gera token de reset (em dev, link no log do servidor) |
| POST | `/auth/reset-password` | — | `{ token, newPassword }` — define nova password |
| POST | `/auth/profile/become-creator` | Bearer | Auto-promoção a `creator` (só papel `user`; devolve novo JWT) |
| POST | `/auth/profile/leave-creator` | Bearer | Abandona `creator` → `user`; apaga podcasts e transmissões do utilizador |

Resposta de sucesso: `{ success, message, data }`.

O link de reset aponta para `{CLIENT_URL}/reset-password?token=…`.

---

## API — Podcasts

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/podcasts/public` | — | Catálogo público — episódios com compressão concluída; query `search`, `category_id`, `page`, `limit`, `sort` |
| GET | `/podcasts/public/:id` | — | Detalhe público de episódio (RF10) |
| GET | `/podcasts` | Bearer | Listagem completa (área autenticada) — query `search`, `category_id`, `page`, `limit`, `sort` |
| GET | `/podcasts/:id` | Bearer | Detalhe de um episódio |
| POST | `/podcasts` | Bearer + criador | Upload multipart (áudio, vídeo e capa opcionais) |
| PATCH | `/podcasts/:id` | Bearer | Editar metadados (dono ou admin) |
| DELETE | `/podcasts/:id` | Bearer | Dono do podcast ou admin |
| GET | `/podcasts/:id/download` | Bearer | Download do ficheiro de áudio |
| GET | `/podcasts/:id/compression-progress` | Bearer | Progresso FFmpeg em tempo real (`audio` / `video`) |

Ficheiros servidos em `/uploads/…` (estático no Express).

### Categorias

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/categories/public` | — | Lista categorias (explorar e formulários) |
| GET | `/categories` | Bearer | Lista categorias (autenticado) |

---

## API — Streaming de áudio (ficheiros)

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/stream/:id` | Bearer ou `?token=` | Stream do áudio comprimido (suporta `<audio src>`) |
| GET | `/stream/:id/video` | Bearer ou `?token=` | Stream do vídeo comprimido |

Middleware `requireStreamAuth` — token no header `Authorization` ou query string.

---

## Live — WebSocket (tempo real)

Sessões **em memória** no processo Node — independentes da tabela `streams` do admin.

### REST

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/live` | Bearer | `{ sessions[], total }` — transmissões activas |
| GET | `/live/scheduled` | Bearer + criador | Agenda do anfitrião |
| GET | `/live/recordings` | Bearer + criador | Gravações do servidor FFmpeg |
| POST | `/live/recordings/:id/publish` | Bearer + criador | Publicar gravação como episódio VOD (RF07) |

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
| GET | `/admin/notifications` | Alertas da plataforma (`?unread=1`, `?limit=30`) |
| GET | `/admin/notifications/unread-count` | Contador de notificações por ler |
| POST | `/admin/notifications/read-all` | Marcar todas como lidas |
| PATCH | `/admin/notifications/:id/read` | Marcar uma notificação como lida |
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

**Notificações** (`admin_notifications`) — eventos automáticos para o admin: novo registo, criador activado/desactivado, episódio publicado/comprimido, live iniciada, pedido de reset de password. UI: sino no painel admin + página `/admin/notifications`.

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
- **Ícone:** `build-resources/icon.png` (256×256) + `icon.ico`; cópia runtime em `electron/icon.png`. Regenerar com `npm run electron:icon` (`scripts/generate-electron-icon.py`, requer Pillow).
- **Build Windows:** `electron:pack` (portable) / `electron:dist` (NSIS). Output em `client/release/` — **não versionar** no Git (limite 100 MB do GitHub).

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

## Testes automatizados (RF01–RF14)

Scripts em `server/scripts/test-rf*.mjs`. Requerem servidor activo em `https://localhost:3001` com certificados mTLS em `server/certs/`.

```bash
cd server
npm run dev          # terminal 1
npm run test:rf09    # um requisito
npm run test:all     # suite RF01–RF14
```

| Script | Requisito |
|--------|-----------|
| `test:rf01` | Autenticação e contas |
| `test:rf02` | Gestão de perfis |
| `test:rf03` | Upload de podcasts |
| `test:rf04` | Armazenamento multimédia |
| `test:rf05` | Compressão automática |
| `test:rf06` | Streaming de reprodução |
| `test:rf07` | VOD (gravações live) |
| `test:rf08` | Controlos do player (contrato API) |
| `test:rf09` | Pesquisa de podcasts |
| `test:rf10` | Consulta de conteúdos |
| `test:rf11` | Download de episódios |
| `test:rf12` | Gestão de permissões |
| `test:rf13` | Registo de atividades |
| `test:rf14` | API RESTful |

CI: `.github/workflows/ci.yml` — PostgreSQL, FFmpeg, `certs:bootstrap`, `typecheck`, `test:all`.

---

## Pendências e melhorias futuras

| Área | Notas |
|------|-------|
| Live vs admin `streams` | Unificar metadados BD com gateway WebSocket |
| Electron | Smoke test de build em CI (opcional) |
| Mobile | RNF05 — cliente web responsivo; apps nativas fora de âmbito |

---

## Changelog recente (resumo)

- **RF01–RF14** — suite de testes automatizados + CI GitHub Actions.
- **RF14** — `GET /api` índice REST + `fetchApiIndex()` no cliente.
- **RF13** — logs em todas as acções principais + `test:rf13`.
- Compressão FFmpeg — progresso real, badges, AAC/OGG, `processing_time_ms`.
- Ícone Electron 256×256 — `build-resources/icon.png` + `icon.ico`, script `npm run electron:icon`.
- SMTP — emails de reset password com template CAMPUS.
- Papel `creator` (RF12) — publicar podcasts e transmitir ao vivo.
- Reset password — `POST /auth/reset-password` + página `/reset-password`.
- Biblioteca de podcasts ligada à API com pesquisa debounced (RF09).
- Upload multipart e streaming (`/api/podcasts`, `/api/stream/:id`).
- Live WebSocket — gateway, REST `GET /api/live`, UI hub/broadcast/watch.
- CORS em dev — qualquer porta localhost (corrige login quando Vite usa 5174).
- Electron — janela frameless, barra de título CAMPUS, redirect na raiz.
- Dashboard com boas-vindas, stats, episódios recentes, painel «ligados agora».
- Painel admin completo: utilizadores (com papel criador), publicações, transmissões, registo.

---

*Atualizar este ficheiro quando alterares contratos de API ou rotas públicas.*
