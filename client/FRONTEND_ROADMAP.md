# Roadmap — Frontend CAMPUS

Plano de evolução da interface **React 19 + Vite + Tailwind 4 + React Router 7** (e Electron quando aplicável). Alinhado com a ordem oficial dos módulos do projeto (`docs/DEVELOPMENT_FLOW.md`).

**Stack:** TypeScript · design system amarelo/preto/prata · cantos retos (`rounded-none`) · Plus Jakarta Sans.

**Última revisão:** junho 2026

---

## Estado atual (baseline)

### Concluído

| Área | Entregáveis |
|------|-------------|
| **Arquitetura** | `app/`, `features/`, `pages/`, `shared/` (layouts, componentes campus, API client, hooks) |
| **Marketing** | Home, login, registo com `MarketingLayout`, fundos por rota, `CampusNav` + indicador deslizante |
| **Design system** | `AuthPanel`, `Field`, `Alert`, `Modal`, `RouteTransition`, tokens em `index.css` + `brand.ts` |
| **Auth (Módulo 1)** | `AuthContext`, `ProtectedRoute`, validação de formulários, skeleton, «Lembrar email» |
| **Recuperação password** | `ForgotPasswordModal` + integração API (fluxo genérico; reset por email pendente no backend) |
| **Área autenticada** | `MainLayout` + dashboard mínimo (saudação + logout) |
| **Dev UX** | Credenciais admin pré-preenchidas em `import.meta.env.DEV` |

### Rotas existentes

| Rota | Página | Layout |
|------|--------|--------|
| `/` | Home | Marketing |
| `/login` | Login | Marketing |
| `/register` | Registo | Marketing |
| `/dashboard` | Dashboard (placeholder) | Main + protegida |

### Lacunas conhecidas (curto prazo)

- [ ] Página **nova password** (token de reset) — depende do backend de email/reset
- [ ] Dashboard alinhado ao design system (ainda básico face ao marketing)
- [ ] Tratamento global de erros API (401 → logout, toast/alert reutilizável)
- [ ] Testes (Vitest + Testing Library) — não iniciados

---

## Princípios do roadmap

1. **Um módulo de cada vez** — UI só depois da API estável do módulo.
2. **Feature-first** — lógica de domínio em `features/<nome>/` (pages, components, hooks, services, types).
3. **Shared enxuto** — só o que é transversal (layout, UI campus, API base).
4. **Mobile-first** — layouts responsivos; Electron reutiliza os mesmos ecrãs.
5. **Acessibilidade** — labels, `aria-*`, foco em modais, `prefers-reduced-motion` (já parcial em CSS).

---

## Fase 0 — Fundação ✅

- [x] Vite + React + TS + Tailwind 4
- [x] Router e estrutura de pastas
- [x] Identidade visual CAMPUS
- [x] Cliente HTTP (`shared/api/client.ts`)
- [x] Layouts marketing vs. app

**Critério de done:** build (`npm run build`) e dev server estáveis.

---

## Fase 1 — Autenticação (~90% frontend)

### Feito

- [x] Login e registo com validação client-side
- [x] Persistência de sessão (token + perfil)
- [x] Rotas protegidas
- [x] Modal esqueci password
- [x] Animações de entrada (rotas, aside, modal com portal)

### Por concluir

- [ ] **Reset password:** rota `/reset-password?token=…` + formulário + estados sucesso/erro/expirado
- [ ] **Perfil mínimo na nav autenticada:** avatar/iniciais, menu utilizador (logout, ir ao perfil)
- [ ] **Refresh de perfil** após editar dados (Módulo 6)
- [ ] Mensagens de erro consistentes (mapear códigos HTTP → copy PT)
- [ ] (Opcional) OAuth / SSO — fora do âmbito académico inicial

**Critério de done:** fluxo completo registo → login → dashboard → logout → recuperação (quando API existir).

---

## Fase 2 — Gestão de podcasts (próximo foco)

### Páginas e rotas

| Rota sugerida | Descrição |
|---------------|-----------|
| `/dashboard` | Hub: resumo + atalhos |
| `/podcasts` | Listagem (grelha ou tabela) |
| `/podcasts/new` | Upload + metadados |
| `/podcasts/:id` | Detalhe + editar + eliminar |
| `/podcasts/:id/edit` | (ou drawer/modal de edição) |

### Features a criar (`features/podcasts/`)

- [ ] `podcast.service.ts` — CRUD + upload multipart
- [ ] Tipos `Podcast`, `Category`, filtros de listagem
- [ ] **Listagem:** cards com capa, título, categoria, data, estado de compressão
- [ ] **Formulário upload:** áudio + capa, progress bar, validação tamanho/tipo
- [ ] **Estados vazios / loading / erro** (skeleton alinhado a `AuthFormSkeleton`)
- [ ] **Confirmação de eliminação** (modal reutilizando `Modal.tsx`)
- [ ] Filtro por categoria (select ou chips)
- [ ] Paginação ou infinite scroll (conforme API)

### UI / layout

- [ ] Sidebar ou top nav no `MainLayout` (Dashboard, Os meus podcasts, Upload)
- [ ] Breadcrumbs em páginas internas
- [ ] Painéis `campus-panel` consistentes com marketing

### Integração

- [ ] Upload com `FormData` e feedback de progresso (`onUploadProgress` no axios)
- [ ] Atualizar lista após criar/editar/apagar (invalidação simples ou refetch)

**Critério de done:** utilizador autenticado cria, vê, edita e apaga podcasts com feedback visual claro.

---

## Fase 3 — Compressão (feedback na UI)

Backend processa FFmpeg; o frontend **reflete estado**, não comprime localmente.

- [ ] Badge/estado por podcast: `pendente` · `a processar` · `concluído` · `falhou`
- [ ] Polling ou SSE/WebSocket leve para atualizar % (se API expuser)
- [ ] Painel de métricas no detalhe: tamanho original vs. comprimido, ratio %
- [ ] Desativar download/stream até compressão concluída (se regra de negócio exigir)
- [ ] Tooltip ou secção «Como funciona a compressão» (educativo)

**Critério de done:** utilizador percebe o estado da compressão sem refrescar manualmente a página.

---

## Fase 4 — Streaming e player

### Componentes (`features/player/` ou `shared/components/player/`)

- [ ] `AudioPlayer` — play/pause, seek, tempo atual/total, volume, mute
- [ ] Integração `GET /stream/:id` (Range requests — transparente no `<audio>` se URL correta)
- [ ] Player na página de detalhe do podcast + mini-player opcional no layout
- [ ] Estados: buffering, erro de rede, fim da faixa
- [ ] Acessibilidade: controlos por teclado, labels nos botões

### UX

- [ ] Capa + waveform ou barra de progresso estilizada (CSS)
- [ ] Lista «A reproduzir agora» no dashboard (opcional)

**Critério de done:** reprodução contínua com seek e controlos fiáveis em desktop e mobile.

---

## Fase 5 — Downloads e pesquisa

### Pesquisa

- [ ] Barra de pesquisa global ou na listagem (`/podcasts?q=`)
- [ ] Filtros: título, categoria, autor (conforme API)
- [ ] URL com query params (partilhável, voltar atrás preserva filtros)
- [ ] Debounce na pesquisa (300–400 ms)

### Downloads

- [ ] Botão download áudio/capa com estado `a descarregar…`
- [ ] Electron: diálogo «Guardar como» / pasta de downloads da app
- [ ] Web: trigger download via blob/link
- [ ] Indicador de ficheiros já descarregados (offline local — fase avançada)

**Critério de done:** encontrar podcast por texto/filtros e descarregar ficheiros com feedback.

---

## Fase 6 — Perfil, segurança e logs

### Perfil (`/profile` ou `/settings`)

- [ ] Ver/editar nome e email
- [ ] Upload avatar (preview + crop opcional)
- [ ] Alterar password (formulário com validação forte)
- [ ] Secção «Sessão» — terminar sessão

### Logs (admin ou próprio utilizador)

- [ ] Tabela simples de ações recentes (data, ação)
- [ ] Paginação; vazio elegante

**Critério de done:** utilizador gere perfil sem sair do design system; logs legíveis.

---

## Fase 7 — Entrega e qualidade

- [ ] Revisão de **todas** as rotas em viewports comuns (360, 768, 1280)
- [ ] Lighthouse básico (performance, a11y)
- [ ] Testes E2E críticos: login, upload, play (Playwright ou Cypress)
- [ ] Testes unitários: validações, hooks, serviços
- [ ] `README` do client atualizado (scripts, env, roadmap link)
- [ ] Build produção + smoke test Electron

---

## Electron (paralelo ao web)

| Item | Prioridade |
|------|------------|
| Janela principal carrega mesma app Vite | Alta |
| Menu nativo mínimo (ficheiro, sair) | Média |
| Notificações de compressão concluída | Baixa |
| Atualizações automáticas | Fora de âmbito académico |

---

## Design system — evolução contínua

- [ ] Documentar tokens (cores, espaçamentos) numa página interna ou Storybook leve
- [ ] Componentes: `Select`, `Textarea`, `Spinner`, `Toast`, `EmptyState`, `DataTable`
- [ ] Variante «danger» consistente em ações destrutivas
- [ ] Dark mode completo (hoje o tema já é escuro; rever contraste WCAG)
- [ ] Iconografia única (evitar mistura de ícones inline ad-hoc)

---

## Estrutura de pastas (alvo)

```
client/src/
├── app/
│   └── App.tsx                 # rotas
├── features/
│   ├── auth/                   # ✅
│   ├── podcasts/               # Fase 2
│   ├── player/                 # Fase 4
│   └── profile/                # Fase 6
├── pages/
│   ├── home/
│   └── dashboard/              # evoluir para hub
└── shared/
    ├── api/
    ├── components/campus/
    ├── components/ui/
    ├── hooks/
    └── layouts/
```

---

## Dependências de API (checklist rápido)

| Fase | Endpoints esperados no client |
|------|-------------------------------|
| 1 | `POST /auth/login`, `register`, `profile`, `forgot-password`, `reset-password` |
| 2 | CRUD `/podcasts`, upload multipart, `GET /categories` |
| 3 | Campo `compression_status` / métricas no modelo podcast |
| 4 | `GET /stream/:id` |
| 5 | `GET /download/:id`, query search em listagem |
| 6 | `PUT /profile`, `PUT /password`, `GET /logs` |

---

## Prioridades recomendadas (próximas 2–4 semanas)

1. **Fechar Módulo 1** — reset password + erros API globais  
2. **MainLayout + navegação app** — preparar Fase 2  
3. **Listagem + upload de podcasts** — valor visível no dashboard  
4. **Player básico** — assim que streaming existir no backend  
5. **Testes** — pelo menos login + upload feliz  

---

## Referências no repositório

| Documento | Local |
|-----------|--------|
| Fluxo por módulo | `docs/DEVELOPMENT_FLOW.md` |
| Roadmap geral (full-stack) | `docs/roadmap.md` |
| Tarefas | `docs/tasks.md` |
| Rotas atuais | `client/src/app/App.tsx` |

---

*Este ficheiro vive em `client/` para ser versionado no Git. Atualizar quando concluir uma fase ou mudar prioridades.*
