# CAMPUS

Plataforma multimédia de **podcasts educativos** — autenticação, gestão de episódios, presença em tempo real, painel de administração e (em desenvolvimento) compressão, streaming e downloads.

Projeto académico · Multimédia 2026.

## Funcionalidades implementadas

| Área | Estado | Resumo |
|------|--------|--------|
| **Autenticação** | ✅ Módulo 1 | Registo, login, JWT, perfil, modal «esqueci password» |
| **Área autenticada** | ✅ | Dashboard, biblioteca de podcasts, publicar, perfil |
| **Presença** | ✅ | Heartbeat + contador de utilizadores ligados no dashboard |
| **Admin** | ✅ | Painel `/admin` — utilizadores, publicações, transmissões, registo |
| **Upload áudio** | ⏳ | Formulário validado no cliente; `POST` multipart pendente (Módulo 2) |
| **FFmpeg / stream** | ⏳ | Planeado nos módulos 3–4 |

## Estrutura do repositório

```
Final-Pro/
├── client/                 # React 19 + Vite 8 + Tailwind 4 + Electron
│   ├── FRONTEND_ROADMAP.md   # Roadmap UI (versionado)
│   └── README.md            # Guia do cliente
├── server/                  # Express 5 + TypeScript + PostgreSQL
├── DOCUMENTATION.md         # API, rotas, BD, admin (versionado)
├── docs/                    # Documentação local (gitignored — cópia opcional)
└── README.md                # Este ficheiro
```

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

Em desenvolvimento, ao arrancar com `DATABASE_URL` definido, o servidor aplica **patches de schema** (`role` em `users`, tabela `streams`, categorias) e garante a conta admin.

### 2. Cliente (web)

```bash
cd client
cp .env.example .env
# VITE_API_URL=http://localhost:3001/api
npm install
npm run dev
```

- UI: `http://localhost:5173`

### 3. Cliente (Electron)

```bash
cd client
npm run electron:dev
```

## Conta de administrador (desenvolvimento)

| Campo | Valor |
|-------|--------|
| Email | `admin@campus.co.ao` |
| Password | `Campus123` |

- Criada/atualizada por `ensureDefaultAdmin` (arranque em dev) ou `npm run db:seed` na pasta `server`.
- Papel `role = admin` na base de dados.
- Após migração, faz **logout e login** para o JWT incluir o papel.

Em `import.meta.env.DEV`, o login pré-preenche estas credenciais.

## Rotas do frontend

| Rota | Acesso | Descrição |
|------|--------|-----------|
| `/` | Público | Home |
| `/explorar` | Público | Explorar (placeholder) |
| `/login`, `/register` | Público | Autenticação |
| `/dashboard` | Autenticado | Hub pessoal, stats, episódios recentes, ligados agora |
| `/podcasts` | Autenticado | Biblioteca com pesquisa e filtros |
| `/podcasts/new` | Autenticado | Publicar episódio (validação local) |
| `/profile` | Autenticado | Perfil e segurança |
| `/admin` | **Admin** | Painel de gestão |
| `/admin/users` | Admin | Contas e papéis |
| `/admin/posts` | Admin | Publicações (podcasts) |
| `/admin/transmissions` | Admin | Transmissões |
| `/admin/logs` | Admin | Registo de acções admin |

## API REST (resumo)

Base: `http://localhost:3001/api` · Autenticação: `Authorization: Bearer <token>`

| Grupo | Endpoints principais |
|-------|----------------------|
| **Health** | `GET /health` |
| **Auth** | `POST /auth/register`, `/login`, `GET /auth/profile`, `POST /auth/forgot-password` |
| **Presença** | `POST /presence/heartbeat`, `/leave`, `GET /presence/online` |
| **Admin** | `GET /admin/overview`, `/users`, `/podcasts`, `/streams`, `/logs`, `/categories` + CRUD |

Detalhe completo: [DOCUMENTATION.md](./DOCUMENTATION.md).

## Base de dados

Schema inicial: `server/src/database/schema.sql`  
Patches idempotentes: `server/src/database/ensureSchemaPatches.ts`

Tabelas principais: `users` (com `role`), `categories`, `podcasts`, `streams`, `logs`.

```bash
cd server
npm run db:migrate   # aplica schema.sql
npm run db:seed      # patches + admin
```

## Documentação

| Ficheiro | Conteúdo |
|----------|----------|
| [DOCUMENTATION.md](./DOCUMENTATION.md) | API, admin, presença, modelo de dados |
| [client/FRONTEND_ROADMAP.md](./client/FRONTEND_ROADMAP.md) | Roadmap e estado do frontend |
| [client/README.md](./client/README.md) | Scripts, env, estrutura `src/` |
| `docs/` (local) | Fluxo por módulos — não versionado (ver `.gitignore`) |

Desenvolvimento por módulos: seguir `docs/DEVELOPMENT_FLOW.md` no teu ambiente local.

## Scripts úteis

| Local | Comando | Descrição |
|-------|---------|-----------|
| server | `npm run dev` | API com hot reload |
| server | `npm run typecheck` | TypeScript |
| server | `npm run db:migrate` | Schema PostgreSQL |
| server | `npm run db:seed` | Patches + admin |
| client | `npm run dev` | Vite |
| client | `npm run build` | Build produção |
| client | `npm run electron:dev` | Desktop + Vite |

## Licença

Projeto académico — uso educativo.
