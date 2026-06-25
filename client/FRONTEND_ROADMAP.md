# Roadmap — Frontend CAMPUS

Plano de evolução da interface **React 19 + Vite + Tailwind 4 + React Router 7** (e Electron quando aplicável). Alinhado com a ordem oficial dos módulos do projeto (`docs/DEVELOPMENT_FLOW.md` no ambiente local).

**Stack:** TypeScript · design system amarelo/preto/prata · cantos retos (`rounded-none`) · Plus Jakarta Sans.

**Última revisão:** junho 2026

---

## Estado actual (baseline)

### Concluído

| Área | Entregáveis |
|------|-------------|
| **Arquitetura** | `app/`, `features/`, `pages/`, `shared/` |
| **Marketing** | Home, login, registo, reset password, `MarketingLayout`, fundos, malha triangular |
| **Design system** | `AuthPanel`, `Field`, `TextAreaField`, `Alert`, `Modal`, `RouteTransition`, `campus-panel`, `DesktopTitleBar` |
| **Auth (Módulo 1)** | `AuthContext`, `ProtectedRoute`, `CreatorRoute`, validação, skeleton, «Lembrar email» |
| **Recuperação password** | `ForgotPasswordModal` + página `/reset-password` |
| **Papel criador (RF12)** | Nav condicional, publicar e broadcast só para `creator`/`admin` |
| **Nav autenticada** | `CampusNav`, indicador deslizante, `NavBrand`, `NavUserMenu`, item «Ao vivo» |
| **Dashboard** | Boas-vindas, stats, episódios recentes, ligados agora, atalhos admin e live |
| **Podcasts** | Biblioteca API, pesquisa debounced (RF09), filtros, detalhe, player, download, compressão |
| **Explorar** | Catálogo público (`/explorar`) — `GET /podcasts/public`, cards sem preview |
| **Publicar** | Upload multipart real, dropzones, categoria «Outros», validação |
| **Perfil** | Layout, avatar, forms nome/password (gravação API Módulo 6 pendente) |
| **Presença** | `usePresenceSession` + painel de utilizadores ligados |
| **Live (Passo 1)** | Hub, broadcast (MediaDevices + WS), watch (listener WS) |
| **Admin** | `/admin` — utilizadores (com papel criador), publicações, transmissões, registo |
| **Electron** | Frameless, barra de título, redirect `/`, menu oculto em prod, ícone 256×256 |
| **Dev UX** | Credenciais admin pré-preenchidas em `import.meta.env.DEV` |

### Rotas existentes

| Rota | Página | Layout / guarda |
|------|--------|-------------------|
| `/` | Home / redirect Electron | Marketing |
| `/explorar` | Catálogo público | Marketing (full-width) |
| `/login` | Login | Marketing |
| `/register` | Registo | Marketing |
| `/reset-password` | Nova password | Marketing |
| `/dashboard` | Dashboard | Main + protegida |
| `/podcasts` | Biblioteca | Main + protegida |
| `/podcasts/:id` | Detalhe | Main + protegida |
| `/podcasts/new` | Publicar | Main + criador |
| `/live` | Hub ao vivo | Main + protegida |
| `/live/broadcast` | Transmitir | Main + criador |
| `/live/:id` | Assistir | Main + protegida |
| `/profile` | Perfil | Main + protegida |
| `/admin` | Painel admin | Main + admin |
| `/admin/users` | Utilizadores | Main + admin |
| `/admin/posts` | Publicações | Main + admin |
| `/admin/transmissions` | Transmissões (BD) | Main + admin |
| `/admin/logs` | Registo | Main + admin |

### Lacunas conhecidas (curto prazo)

- [ ] **SMTP real** para email de reset (hoje: link no log do servidor em dev)
- [ ] **Gravar perfil** quando API Módulo 6 existir (`PUT` perfil/password)
- [ ] **Unificar** admin `streams` (BD) com sessões live WebSocket
- [ ] Mensagens de erro live mais claras («transmissão já não está activa»)
- [x] Tratamento global de erros API (401 → logout, toast reutilizável)
- [ ] Testes (Vitest + Testing Library)
- [x] Ícone Electron 256×256 + `.ico` para Windows
- [x] Smoke test do build Electron (`npm run electron:smoke`)

---

## Princípios do roadmap

1. **Um módulo de cada vez** — UI alinhada à API estável do módulo.
2. **Feature-first** — `features/<nome>/` (pages, components, hooks, services, types).
3. **Shared enxuto** — só transversal em `shared/`.
4. **Mobile-first** — Electron reutiliza os mesmos ecrãs.
5. **Acessibilidade** — labels, `aria-*`, foco em modais.

---

## Fase 0 — Fundação ✅

- [x] Vite + React + TS + Tailwind 4
- [x] Router e estrutura de pastas
- [x] Identidade visual CAMPUS
- [x] Cliente HTTP (`shared/api/client.ts`)
- [x] Layouts marketing vs. app

---

## Fase 1 — Autenticação ✅ (frontend)

### Feito

- [x] Login e registo com validação
- [x] Persistência de sessão (token + perfil com `role`)
- [x] Rotas protegidas + `AdminRoute` + `CreatorRoute`
- [x] Modal esqueci password
- [x] Página reset password (`/reset-password?token=`)
- [x] Nav com avatar e menu utilizador

### Por concluir

- [ ] Refresh de perfil após editar (Módulo 6)
- [x] Mensagens HTTP → copy PT centralizadas (`shared/copy/campusMessages.ts`)
- [ ] Envio real de email (SMTP)

---

## Fase 2 — Gestão de podcasts (~85% frontend)

### Feito

- [x] Rotas `/podcasts`, `/podcasts/new`, `/podcasts/:id`
- [x] `podcast.service.ts` — `GET`, `POST` multipart, download
- [x] Listagem API: cards, filtros, pesquisa debounced, ordenação, skeleton
- [x] Formulário: áudio, capa, metadados, «Outros»
- [x] Detalhe com player e download
- [x] Restrição de publicação a criadores (RF12)

### Por concluir

- [x] Editar/eliminar episódio pelo próprio utilizador (UI)
- [ ] Progress bar de upload mais visível
- [ ] Paginação ou infinite scroll
- [x] Badges de compressão (Módulo 3)

---

## Fase 2b — Administração ✅ (frontend)

- [x] Layout lateral `AdminLayout` + navegação por secção
- [x] Painel: métricas + atalhos
- [x] Utilizadores: listar, editar (modal), papel (`user`/`creator`/`admin`), eliminar
- [x] Publicações: criar, editar, remover (metadados)
- [x] Transmissões: criar, editar, estados, eliminar (BD)
- [x] Registo de acções admin (`/admin/logs`)
- [x] Integração com API `/api/admin/*`

---

## Fase 2c — Presença ✅

- [x] Heartbeat na área autenticada
- [x] Contador e lista no dashboard
- [x] Integração `GET /presence/online`

---

## Fase 2d — Live WebSocket ✅ (Passo 2)

### Feito

- [x] `features/live/` — types, service, hooks, páginas
- [x] Hub `/live` com lista de sessões (`GET /api/live`)
- [x] Broadcast `/live/broadcast` — captura média + WS
- [x] Watch `/live/:id` — listener WS
- [x] Nav «Ao vivo» e atalho no dashboard
- [x] Restrição de broadcast a criadores
- [x] Ligar broadcast à tabela `streams` (agendada → em direto na BD)
- [x] `GET /api/live/scheduled` — transmissões agendadas do criador
- [x] Reconexão do anfitrião (30 s de tolerância + `resume` WS)
- [x] Ouvinte: retry automático e estado «anfitrião a reconectar»
- [x] Admin: ouvintes WS, ligação activa, sem «em direto» manual
- [x] Gravação local pós-live + publicar como episódio

### Por concluir

- [ ] VOD automático no servidor (gravação FFmpeg já existe no gateway)

---

## Fase 3 — Compressão (feedback na UI)

- [x] Badge por podcast: pendente / a processar / concluído
- [x] Polling de progresso FFmpeg no detalhe
- [x] Métricas original vs. comprimido no detalhe

---

## Fase 4 — Streaming e player (~40%)

### Feito

- [x] Player básico no detalhe (`/podcasts/:id`)
- [x] `GET /api/stream/:id` integrado

### Por concluir

- [ ] `AudioPlayer` reutilizável — seek, volume, fila
- [ ] Mini-player opcional na navegação

---

## Fase 5 — Downloads e pesquisa global

- [x] Download de episódio (`GET /podcasts/:id/download`)
- [ ] Pesquisa global ou URL `?q=` fora da biblioteca
- [ ] Electron: diálogo guardar ficheiro nativo

---

## Fase 6 — Perfil e API (~50% frontend)

### Feito

- [x] Página `/profile` com secções e validação local

### Por concluir

- [ ] `PUT` perfil e password no servidor
- [x] Upload avatar (perfil + navegação)
- [ ] Logs do próprio utilizador (se exposto pela API)

---

## Fase 7 — Qualidade e Electron

- [x] README do client actualizado
- [x] Electron dev (frameless, title bar, redirect)
- [x] Ícone 256×256 + `icon.ico` (`npm run electron:icon`)
- [ ] Responsivo 360 / 768 / 1280 (revisão final)
- [ ] Testes E2E (login, upload, play, live)
- [ ] Testes unitários (validações, hooks)
- [x] Build Electron smoke test (`npm run electron:smoke` — portable + arranque UI)

---

## Estrutura de pastas (actual)

```
client/src/
├── app/
│   ├── App.tsx
│   └── ElectronRootRedirect.tsx
├── features/
│   ├── auth/           ✅ (+ CreatorRoute, reset)
│   ├── dashboard/      ✅
│   ├── podcasts/       ✅ (API + upload)
│   ├── profile/        ✅ (UI)
│   ├── presence/       ✅
│   ├── live/           🟡 Passo 1
│   └── admin/          ✅
├── pages/              # re-exports
└── shared/
    ├── api/
    ├── components/campus/  (+ DesktopTitleBar)
    ├── layouts/            (+ ElectronShell)
    ├── navigation/
    └── hooks/              (+ useDebounce)
```

---

## Dependências de API (checklist)

| Área | Estado client | Endpoints |
|------|---------------|-----------|
| Auth | ✅ | login, register, profile, forgot-password, reset-password |
| Presença | ✅ | heartbeat, leave, online |
| Admin | ✅ | overview, users, podcasts, streams, logs, categories |
| Podcasts (user) | ✅ | GET, POST multipart, DELETE, download |
| Stream | ✅ | GET /stream/:id (player) |
| Live WS | 🟡 | GET /live + ws://…/live |
| Perfil | ⏳ | PUT profile, password |

---

## Prioridades recomendadas

1. **Perfil API** — `PUT` perfil e password (Módulo 6)  
2. ~~**Live Passo 2** — unificar com `streams` do admin~~ ✅  
3. **Compressão UI** — badges quando FFmpeg estiver activo  
4. **Player** — componente reutilizável com seek/volume  
5. **Testes** — login + publicar + live smoke  

---

## Referências versionadas

| Documento | Local |
|-----------|--------|
| README do monorepo | `../README.md` |
| API e modelo de dados | `../DOCUMENTATION.md` |
| Este roadmap | `client/FRONTEND_ROADMAP.md` |
| Rotas | `client/src/app/App.tsx` |
| Fluxo por módulo (local) | `docs/DEVELOPMENT_FLOW.md` |

---

*Atualizar quando concluíres uma fase ou mudares prioridades.*
