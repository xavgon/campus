# CAMPUS

Plataforma multimédia distribuída de **podcasts educativos** — compressão, streaming, upload/download e autenticação.

Projeto académico · Multimédia 2026.

## Estrutura

```
Final-Pro/
├── client/          # React + Vite + Electron + Tailwind
├── server/          # Express + TypeScript + PostgreSQL
├── docs/            # Documentação do projeto (gitignored)
└── README.md
```

## Identidade visual

- **Amarelo** `#F5C518` — primária, CTAs
- **Preto** `#0A0A0A` / `#121212` — fundo, contraste
- **Prata** `#B8B8B8` — texto secundário, detalhes metálicos
- **Fonte:** Plus Jakarta Sans

## Pré-requisitos

- Node.js 20+
- PostgreSQL 15+
- FFmpeg (para módulos de compressão, mais tarde)

## Configuração

### Servidor

```bash
cd server
cp .env.example .env
# Editar DATABASE_URL e JWT_SECRET
npm install
npm run dev
```

API: `http://localhost:3001` · Health: `GET /api/health`

**Auth (Módulo 1):** `POST /api/auth/register` · `POST /api/auth/login` · `GET /api/auth/profile` (Bearer token)

**Admin (desenvolvimento):** após `db:migrate`, o servidor cria/atualiza automaticamente:

| Campo | Valor |
|-------|--------|
| Email | `admin@campus.co.ao` |
| Password | `Campus123` |

Manual: `npm run db:seed` (na pasta `server`).

### Cliente (web)

```bash
cd client
cp .env.example .env
npm install
npm run dev
```

UI: `http://localhost:5173`

### Cliente (Electron)

```bash
cd client
npm run electron:dev
```

(Requer Vite a correr — o script inicia ambos.)

### Base de dados (Neon)

1. Cria o projeto no Neon (ex.: `sa-east-1` São Paulo).
2. Copia a connection string para `server/.env` → `DATABASE_URL`.
3. Aplica o schema:

```bash
cd server
npm run db:migrate
```

Alternativa local: `createdb campus` + `psql -d campus -f server/src/database/schema.sql`

## Desenvolvimento

Seguir `docs/DEVELOPMENT_FLOW.md` — **um módulo de cada vez**, ordem 1→8.

Documentação em `docs/` (local, não versionada) — atualizar sempre que o código mudar.

## Scripts úteis

| Local | Comando | Descrição |
|-------|---------|-----------|
| server | `npm run dev` | API com hot reload |
| server | `npm run typecheck` | Verificar TypeScript |
| client | `npm run dev` | Vite dev server |
| client | `npm run electron:dev` | App desktop |
| client | `npm run build` | Build produção |

## Licença

Projeto académico — uso educativo.
