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

A URL WebSocket live é derivada automaticamente (`http` → `ws`, sem sufixo `/api`).

## Scripts

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento Vite (`:5173`; pode usar `5174` se ocupada) |
| `npm run build` | `tsc -b` + build de produção em `dist/` |
| `npm run preview` | Pré-visualizar build |
| `npm run lint` | ESLint |
| `npm run electron:dev` | Vite `:5173` fixa + Electron — **não** correr `dev` em paralelo |
| `npm run electron:icon` | Gera `build-resources/icon.png` (256×256) e `icon.ico` |
| `npm run electron:build` | Build web + Electron |
| `npm run electron:pack` | App portable (`release/win-unpacked/`) |
| `npm run electron:dist` | Portable + instalador NSIS (`release/`) |
| `npm run electron:smoke` | Build + empacotamento portable + teste de arranque da UI |

## Rotas

### Marketing (`MarketingLayout`)

| Rota | Página |
|------|--------|
| `/` | Home (web) · redirect em Electron |
| `/explorar` | Catálogo público (API `/podcasts/public`) |
| `/login` | Login |
| `/register` | Registo |
| `/reset-password` | Nova password (`?token=`) |

### Aplicação (`MainLayout` + `ProtectedRoute`)

| Rota | Página | Notas |
|------|--------|-------|
| `/dashboard` | Dashboard | Stats, ligados agora, atalhos |
| `/podcasts` | Biblioteca | API, pesquisa com debounce 300 ms |
| `/podcasts/:id` | Detalhe | Player e download |
| `/podcasts/new` | Publicar | Só criador/admin (`CreatorRoute`) |
| `/live` | Ao vivo | Lista transmissões activas |
| `/live/broadcast` | Transmitir | Só criador/admin |
| `/live/:id` | Assistir | WebSocket listener |
| `/profile` | Perfil | Nome, password |

### Admin (`AdminRoute` + `AdminLayout`) — só `role: admin`

| Rota | Página |
|------|--------|
| `/admin` | Painel / métricas |
| `/admin/users` | Gestão de contas (papéis: user, creator, admin) |
| `/admin/posts` | Publicações (podcasts) |
| `/admin/transmissions` | Transmissões (metadados BD) |
| `/admin/logs` | Registo de acções |

## Estrutura `src/`

```
src/
├── app/
│   ├── App.tsx                 # Definição de rotas
│   └── ElectronRootRedirect.tsx
├── features/
│   ├── auth/                   # Contexto, login, registo, CreatorRoute, reset
│   ├── dashboard/              # Hub da área pessoal
│   ├── podcasts/               # Biblioteca, publicar, detalhe, player
│   ├── profile/                # Perfil e secções
│   ├── presence/               # Heartbeat e utilizadores ligados
│   ├── live/                   # Hub, broadcast, watch (WebSocket)
│   └── admin/                  # Painel de administração
├── pages/                      # Re-exports finos para rotas
└── shared/
    ├── api/client.ts           # Axios + token + SERVER_URL
    ├── components/campus/      # Design system (Nav, Field, DesktopTitleBar…)
    ├── layouts/                # MainLayout, MarketingLayout, ElectronShell
    ├── navigation/             # navConfig (getAppNavItems)
    ├── hooks/                  # useDebounce, useNavIndicator…
    └── styles/brand.ts         # Tokens de marca
```

## Electron

Ficheiros em `electron/`:

| Ficheiro | Função |
|----------|--------|
| `main.cjs` | Janela frameless, ícone, IPC controlos, guards de navegação |
| `preload.cjs` | Bridge segura (`window.campusDesktop`) |
| `menu.cjs` | Menu oculto (prod) / mínimo (dev, Alt) |
| `icon.png` | Cópia runtime do ícone (256×256) — gerada por `npm run electron:icon` |

Ícones de build em `build-resources/`:

| Ficheiro | Uso |
|----------|-----|
| `icon.png` | Master 256×256 (emblema amarelo + «C») |
| `icon.ico` | Windows — taskbar, executável e instalador NSIS |

Regenerar após alterar a marca:

```bash
npm run electron:icon
```

O script `scripts/generate-electron-icon.py` requer **Pillow** (`pip install pillow`). O empacotamento manual aplica o `.ico` ao `CAMPUS.exe` via `rcedit`.

Comportamento desktop:

- Barra de título personalizada (`DesktopTitleBar`) — minimizar, maximizar, fechar.
- `/` redirecciona para login ou dashboard conforme sessão.
- Links externos abrem no browser do sistema.

## Desenvolvimento

- **Admin em dev:** login `admin@campus.co.ao` / `Campus123` (pré-preenchido em DEV).
- **Criador:** atribuir papel `creator` em `/admin/users` e fazer logout/login.
- **Presença:** com a API activa, o dashboard mostra utilizadores ligados (heartbeat automático na área autenticada).
- **Live:** servidor com `npm run dev`; broadcaster em `/live/broadcast`, ouvintes em `/live` ou `/live/:id`.
- **Porta Vite:** se `5173` estiver ocupada (ex.: Electron anterior), `npm run dev` usa `5174` — o CORS do servidor aceita ambas em dev.

## Roadmap

Ver [FRONTEND_ROADMAP.md](./FRONTEND_ROADMAP.md).

## Documentação do projeto

- [README raiz](../README.md)
- [DOCUMENTATION.md](../DOCUMENTATION.md) — API, live WebSocket e modelo de dados
- [server/README.md](../server/README.md) — guia do servidor
