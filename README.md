# CAMPUS

Plataforma multimédia de **podcasts educativos** — autenticação, gestão de episódios, presença em tempo real, transmissão ao vivo (WebSocket), painel de administração e cliente desktop (Electron).

Projeto académico · Multimédia 2026.

## Funcionalidades implementadas

| Área | Estado | Resumo |
|------|--------|--------|
| **Autenticação** | ✅ | Registo, login, JWT, perfil, «esqueci password», reset com token (`/reset-password`) |
| **Papel criador (RF12)** | ✅ | `role = creator` — publicar podcasts e transmitir ao vivo |
| **Área autenticada** | ✅ | Dashboard, biblioteca, detalhe, publicar (criadores), perfil |
| **Podcasts (API)** | ✅ | Listagem com pesquisa/filtros (debounce), upload multipart, download, streaming, catálogo público |
| **Explorar** | ✅ | `/explorar` — catálogo público (`GET /podcasts/public`) sem login |
| **Presença** | ✅ | Heartbeat + contador de utilizadores ligados no dashboard |
| **Live (WebSocket)** | 🟡 Passo 2 | Hub `/live`, broadcast e ouvinte via WS `/live` (sessões em memória) |
| **Admin** | ✅ | Painel `/admin` — utilizadores, publicações, transmissões (BD), registo |
| **Electron** | ✅ | Janela frameless, barra de título CAMPUS, ícone 256×256, instalador Windows |
| **FFmpeg / compressão** | ✅ | Compressão áudio/vídeo, progresso real, badges na biblioteca |

> **Nota:** As transmissões do painel admin (`streams` na BD) e as sessões live WebSocket são sistemas distintos — ainda não estão unificados.

## Estrutura do repositório

```
Final-Pro/
├── client/                 # React 19 + Vite 8 + Tailwind 4 + Electron
│   ├── electron/             # main.cjs, preload, menu
│   ├── FRONTEND_ROADMAP.md   # Roadmap UI (versionado)
│   └── README.md             # Guia do cliente
├── server/                   # Express 5 + TypeScript + PostgreSQL + ws
├── DOCUMENTATION.md          # API, rotas, BD, live, admin (versionado)
├── docs/                     # Documentação local (gitignored — cópia opcional)
└── README.md                 # Este ficheiro
```

Não existe `package.json` na raiz — os comandos `npm` correm em `client/` ou `server/`.

## Identidade visual

- **Amarelo** `#F5C518` — primária, CTAs
- **Preto** `#0A0A0A` / `#121212` — fundo
- **Prata** `#B8B8B8` — texto secundário
- **Fonte:** Plus Jakarta Sans · cantos retos (`rounded-none`)

## Pré-requisitos

- Node.js 20+
- PostgreSQL 15+ (ou Neon)
- FFmpeg (módulos de compressão, mais tarde)

## Arranque rápido

### 1. Servidor

```bash
cd server
cp .env.example .env
# Editar DATABASE_URL e JWT_SECRET
npm install
npm run db:migrate
npm run dev
```

- API: `http://localhost:3001`
- Health: `GET /api/health`
- WebSocket live: `ws://localhost:3001/live`
- Página de teste (dev): `http://localhost:3001/live-test`

Em desenvolvimento, ao arrancar com `DATABASE_URL` definido, o servidor aplica **patches de schema** (`role` em `users`, tabela `streams`, categorias) e garante a conta admin.

### 2. Cliente (web)

```bash
cd client
cp .env.example .env
# VITE_API_URL=http://localhost:3001/api
npm install
npm run dev
```

- UI: `http://localhost:5173` (ou `5174` se a porta 5173 estiver ocupada)
- Em dev, o CORS do servidor aceita **qualquer porta** `localhost` / `127.0.0.1`

### 3. Cliente (Electron)

```bash
cd client
npm run electron:dev          # desenvolvimento (Vite + Electron)
npm run electron:icon         # regenerar ícone 256×256 (PNG + ICO)
npm run electron:dist         # instalador Windows em release/
```

- Usa Vite em `:5173` com `--strictPort` — **não correr** `npm run dev` em paralelo na mesma porta
- Em Electron, `/` redirecciona para login ou dashboard conforme a sessão
- Janela sem moldura nativa (`frame: false`) com barra de título personalizada
- Ícone da app: `build-resources/icon.png` (256×256) + `icon.ico` para Windows
- **Não versionar** `client/release/` — artefactos de build (ver `.gitignore`); publicar instaladores via GitHub Releases

## Conta de administrador (desenvolvimento)

| Campo | Valor |
|-------|--------|
| Email | `admin@campus.co.ao` |
| Password | `Campus123` |

- Criada/atualizada por `ensureDefaultAdmin` (arranque em dev) ou `npm run db:seed` na pasta `server`.
- Papel `role = admin` na base de dados (admin também pode publicar e transmitir).
- Após migração ou alteração de papel, faz **logout e login** para o JWT reflectir o papel.

Em `import.meta.env.DEV`, o login pré-preenche estas credenciais.

Para testar o papel **criador**, um utilizador pode activá-lo em **Perfil → Conta de criador**, ou um admin pode atribuir `role = creator` em `/admin/users`.

## Rotas do frontend

| Rota | Acesso | Descrição |
|------|--------|-----------|
| `/` | Público | Home (web) · redirect em Electron |
| `/explorar` | Público | Catálogo público de episódios comprimidos |
| `/login`, `/register` | Público | Autenticação |
| `/reset-password` | Público | Nova password com `?token=` |
| `/dashboard` | Autenticado | Hub pessoal, stats, episódios recentes, ligados agora |
| `/podcasts` | Autenticado | Biblioteca com pesquisa e filtros (API) |
| `/podcasts/:id` | Autenticado | Detalhe e player |
| `/podcasts/new` | **Criador / admin** | Publicar episódio (upload multipart) |
| `/live` | Autenticado | Hub de transmissões activas |
| `/live/broadcast` | **Criador / admin** | Iniciar transmissão (câmara/microfone) |
| `/live/:id` | Autenticado | Assistir transmissão em curso |
| `/profile` | Autenticado | Perfil e segurança |
| `/admin` | **Admin** | Painel de gestão |
| `/admin/users` | Admin | Contas e papéis (`user`, `creator`, `admin`) |
| `/admin/posts` | Admin | Publicações (podcasts) |
| `/admin/transmissions` | Admin | Transmissões (metadados na BD) |
| `/admin/logs` | Admin | Registo de acções admin |

## API REST (resumo)

Base: `http://localhost:3001/api` · Autenticação: `Authorization: Bearer <token>`

| Grupo | Endpoints principais |
|-------|----------------------|
| **Health** | `GET /health` |
| **Auth** | `POST /auth/register`, `/login`, `GET /auth/profile`, `/forgot-password`, `/reset-password` |
| **Podcasts** | `GET /podcasts`, `GET /podcasts/public`, `GET /podcasts/:id`, `POST /podcasts` (criador), `PATCH`/`DELETE`, `GET /podcasts/:id/download`, `GET /podcasts/:id/compression-progress` |
| **Categorias** | `GET /categories` — público (formulários e explorar) |
| **Stream** | `GET /stream/:id` — áudio comprimido (token no header ou `?token=`) |
| **Live** | `GET /live` — sessões WebSocket activas (memória) |
| **Presença** | `POST /presence/heartbeat`, `/leave`, `GET /presence/online` |
| **Admin** | `GET /admin/overview`, `/users`, `/podcasts`, `/streams`, `/logs`, `/categories` + CRUD |

**WebSocket** (não REST): `ws://localhost:3001/live?token=…&role=broadcaster|listener&liveId=…`

Detalhe completo: [DOCUMENTATION.md](./DOCUMENTATION.md).

## Base de dados

Schema inicial: `server/src/database/schema.sql`  
Patches idempotentes: `server/src/database/ensureSchemaPatches.ts`

Tabelas principais: `users` (com `role`: `user` \| `creator` \| `admin`), `categories`, `podcasts`, `streams`, `logs`.

```bash
cd server
npm run db:migrate   # aplica schema.sql
npm run db:seed      # patches + admin
```

## Documentação

| Ficheiro | Conteúdo |
|----------|----------|
| [DOCUMENTATION.md](./DOCUMENTATION.md) | API, live WS, admin, presença, modelo de dados |
| [client/FRONTEND_ROADMAP.md](./client/FRONTEND_ROADMAP.md) | Roadmap e estado do frontend |
| [client/README.md](./client/README.md) | Scripts, env, Electron, estrutura `src/` |
| [server/README.md](./server/README.md) | Scripts e rotas do servidor |
| `docs/` (local) | Fluxo por módulos — não versionado (ver `.gitignore`) |

Desenvolvimento por módulos: seguir `docs/DEVELOPMENT_FLOW.md` no teu ambiente local.

## Scripts úteis

| Local | Comando | Descrição |
|-------|---------|-----------|
| server | `npm run dev` | API + WebSocket live |
| server | `npm run typecheck` | TypeScript |
| server | `npm run db:migrate` | Schema PostgreSQL |
| server | `npm run db:seed` | Patches + admin |
| client | `npm run dev` | Vite (web) |
| client | `npm run build` | Build produção |
| client | `npm run electron:dev` | Desktop + Vite (`:5173` fixa) |
| client | `npm run electron:icon` | Gera ícone PNG 256×256 + ICO |
| client | `npm run electron:dist` | Instalador Windows (`release/`) |

## Licença

Projeto académico — uso educativo.
