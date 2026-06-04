# CAMPUS — Cliente

Interface **React 19 + TypeScript + Vite 8 + Tailwind CSS 4 + React Router 7**, com build **Electron** opcional. Design system amarelo/preto/prata, cantos retos.

## Requisitos

- Node.js 20+
- API CAMPUS a correr (`server/`) — ver [README](../README.md)

## Configuração

```bash
cp .env.example .env
npm install
npm run dev
```

| Variável | Descrição |
|----------|-----------|
| `VITE_API_URL` | Base da API (ex.: `http://localhost:3001/api`) |

## Scripts

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento Vite (`:5173`) |
| `npm run build` | `tsc -b` + build de produção em `dist/` |
| `npm run preview` | Pré-visualizar build |
| `npm run lint` | ESLint |
| `npm run electron:dev` | Vite + Electron |
| `npm run electron:build` | Build web + Electron |

## Rotas

### Marketing (`MarketingLayout`)

| Rota | Página |
|------|--------|
| `/` | Home |
| `/explorar` | Explorar |
| `/login` | Login |
| `/register` | Registo |

### Aplicação (`MainLayout` + `ProtectedRoute`)

| Rota | Página | Notas |
|------|--------|-------|
| `/dashboard` | Dashboard | Stats, ligados agora, atalhos |
| `/podcasts` | Biblioteca | Grelha, filtros, demo/API |
| `/podcasts/new` | Publicar | Áudio, capa, categoria, «Outros» |
| `/profile` | Perfil | Nome, password (API pendente) |

### Admin (`AdminRoute` + `AdminLayout`) — só `role: admin`

| Rota | Página |
|------|--------|
| `/admin` | Painel / métricas |
| `/admin/users` | Gestão de contas |
| `/admin/posts` | Publicações (podcasts) |
| `/admin/transmissions` | Transmissões |
| `/admin/logs` | Registo de acções |

## Estrutura `src/`

```
src/
├── app/App.tsx              # Definição de rotas
├── features/
│   ├── auth/                # Contexto, login, registo, ProtectedRoute
│   ├── dashboard/           # Hub da área pessoal
│   ├── podcasts/            # Biblioteca, publicar, componentes
│   ├── profile/             # Perfil e secções
│   ├── presence/            # Heartbeat e utilizadores ligados
│   └── admin/               # Painel de administração
├── pages/                   # Re-exports finos para rotas
└── shared/
    ├── api/client.ts        # Axios + token
    ├── components/campus/   # Design system (Nav, Field, Modal…)
    ├── layouts/             # MainLayout, MarketingLayout
    ├── navigation/          # navConfig
    └── styles/brand.ts      # Tokens de marca
```

## Desenvolvimento

- **Admin em dev:** login `admin@campus.co.ao` / `Campus123` (pré-preenchido em DEV).
- **Presença:** com a API activa, o dashboard mostra utilizadores ligados (heartbeat automático na área autenticada).
- **Dados demo:** a biblioteca de podcasts usa `DEMO_PODCASTS` até existir `GET /api/podcasts`.

## Roadmap

Ver [FRONTEND_ROADMAP.md](./FRONTEND_ROADMAP.md).

## Documentação do projeto

- [README raiz](../README.md)
- [DOCUMENTATION.md](../DOCUMENTATION.md) — API e modelo de dados
