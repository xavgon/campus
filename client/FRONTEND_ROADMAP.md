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
| **Marketing** | Home, login, registo, `MarketingLayout`, fundos, malha triangular |
| **Design system** | `AuthPanel`, `Field`, `TextAreaField`, `Alert`, `Modal`, `RouteTransition`, `campus-panel` |
| **Auth (Módulo 1)** | `AuthContext`, `ProtectedRoute`, validação, skeleton, «Lembrar email» |
| **Recuperação password** | `ForgotPasswordModal` (reset por email pendente no backend) |
| **Nav autenticada** | `CampusNav`, indicador deslizante, `NavBrand`, `NavUserMenu` (avatar + Sair) |
| **Dashboard** | Boas-vindas, stats, episódios recentes, ligados agora, atalho admin |
| **Podcasts** | Biblioteca com grelha, pesquisa, filtros, ordenação, estados vazio/loading |
| **Publicar** | Formulário completo, dropzones, categoria «Outros», validação local |
| **Perfil** | Layout, avatar, forms nome/password (gravação API Módulo 6 pendente) |
| **Presença** | `usePresenceSession` + painel de utilizadores ligados |
| **Admin** | `/admin` — utilizadores, publicações, transmissões, registo; CRUD com formulários e modais |
| **Dev UX** | Credenciais admin pré-preenchidas em `import.meta.env.DEV` |

### Rotas existentes

| Rota | Página | Layout |
|------|--------|--------|
| `/` | Home | Marketing |
| `/explorar` | Explorar | Marketing |
| `/login` | Login | Marketing |
| `/register` | Registo | Marketing |
| `/dashboard` | Dashboard | Main + protegida |
| `/podcasts` | Biblioteca | Main + protegida |
| `/podcasts/new` | Publicar | Main + protegida |
| `/profile` | Perfil | Main + protegida |
| `/admin` | Painel admin | Main + admin |
| `/admin/users` | Utilizadores | Main + admin |
| `/admin/posts` | Publicações | Main + admin |
| `/admin/transmissions` | Transmissões | Main + admin |
| `/admin/logs` | Registo | Main + admin |

### Lacunas conhecidas (curto prazo)

- [ ] Página **nova password** (`/reset-password?token=…`)
- [ ] **Upload real** de áudio/capa (`POST` multipart + progresso)
- [ ] Substituir **dados demo** da biblioteca por `GET /api/podcasts`
- [ ] **Gravar perfil** quando API Módulo 6 existir
- [ ] Tratamento global de erros API (401 → logout, toast reutilizável)
- [ ] Testes (Vitest + Testing Library)

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

## Fase 1 — Autenticação (~90% frontend)

### Feito

- [x] Login e registo com validação
- [x] Persistência de sessão (token + perfil com `role`)
- [x] Rotas protegidas + `AdminRoute`
- [x] Modal esqueci password
- [x] Nav com avatar e menu utilizador

### Por concluir

- [ ] Reset password: rota + formulário + estados
- [ ] Refresh de perfil após editar (Módulo 6)
- [ ] Mensagens HTTP → copy PT centralizadas

---

## Fase 2 — Gestão de podcasts (~60% frontend)

### Feito

- [x] Rotas `/podcasts`, `/podcasts/new`
- [x] Tipos, constantes, validação de publicação
- [x] Listagem: cards, filtros, pesquisa, ordenação, skeleton
- [x] Formulário: áudio, capa, metadados, «Outros»
- [x] Estados vazios e mensagens de demo/API

### Por concluir

- [ ] `podcast.service.ts` — `GET/POST` multipart real
- [ ] `/podcasts/:id` — detalhe, editar, eliminar (utilizador)
- [ ] Progress bar de upload
- [ ] Paginação ou infinite scroll
- [ ] Remover `DEMO_PODCASTS` quando API estiver ligada

---

## Fase 2b — Administração ✅ (frontend)

- [x] Layout lateral `AdminLayout` + navegação por secção
- [x] Painel: métricas + atalhos
- [x] Utilizadores: listar, editar (modal), papel, eliminar
- [x] Publicações: criar, editar, remover (metadados; áudio via Módulo 2)
- [x] Transmissões: criar, editar, estados, eliminar
- [x] Registo de acções admin (`/admin/logs`)
- [x] Integração com API `/api/admin/*`

---

## Fase 2c — Presença ✅

- [x] Heartbeat na área autenticada
- [x] Contador e lista no dashboard
- [x] Integração `GET /presence/online`

---

## Fase 3 — Compressão (feedback na UI)

- [ ] Badge por podcast: pendente / a processar / concluído / falhou
- [ ] Polling ou SSE para %
- [ ] Métricas original vs. comprimido no detalhe

---

## Fase 4 — Streaming e player

- [ ] `AudioPlayer` — play/pause, seek, volume
- [ ] Integração `GET /stream/:id`
- [ ] Mini-player opcional

---

## Fase 5 — Downloads e pesquisa global

- [ ] Pesquisa global ou URL `?q=`
- [ ] Download com estados
- [ ] Electron: diálogo guardar ficheiro

---

## Fase 6 — Perfil e API (~50% frontend)

### Feito

- [x] Página `/profile` com secções e validação local

### Por concluir

- [ ] `PUT` perfil e password no servidor
- [ ] Upload avatar
- [ ] Logs do próprio utilizador (se exposto pela API)

---

## Fase 7 — Qualidade

- [ ] Responsivo 360 / 768 / 1280
- [ ] Testes E2E (login, upload, play)
- [ ] Testes unitários (validações, hooks)
- [x] README do client actualizado
- [ ] Build Electron smoke test

---

## Estrutura de pastas (actual)

```
client/src/
├── app/App.tsx
├── features/
│   ├── auth/           ✅
│   ├── dashboard/      ✅
│   ├── podcasts/       ✅ (demo + forms)
│   ├── profile/        ✅ (UI)
│   ├── presence/       ✅
│   └── admin/          ✅
├── pages/              # re-exports
└── shared/
    ├── api/
    ├── components/campus/
    ├── layouts/
    ├── navigation/
    └── hooks/
```

---

## Dependências de API (checklist)

| Área | Estado client | Endpoints |
|------|---------------|-----------|
| Auth | ✅ | login, register, profile, forgot-password |
| Presença | ✅ | heartbeat, leave, online |
| Admin | ✅ | overview, users, podcasts, streams, logs, categories |
| Podcasts (user) | ⏳ | CRUD + upload multipart |
| Stream | ⏳ | player URL |
| Perfil | ⏳ | PUT profile, password |

---

## Prioridades recomendadas

1. **Ligar upload** — `POST /api/podcasts` multipart  
2. **Listagem real** — remover demo na biblioteca  
3. **Reset password** — rota + backend email  
4. **Player** — quando streaming existir  
5. **Testes** — login + publicar + admin smoke  

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
