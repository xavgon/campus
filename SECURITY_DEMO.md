# CAMPUS — Guia de Demonstração de Segurança

**Projecto:** Plataforma Académica de Podcasts — CAMPUS  
**Disciplina:** Multimédia · ISPTEC · 2026  
**Tema:** Segurança com Certificados Digitais, mTLS e Não Repúdio

---

## Pré-requisitos

```bash
# 1. Instalar dependências
npm install          # pasta raiz
cd server && npm install
cd ../client && npm install

# 2. Gerar certificados (se ainda não existirem)
cd server && npm run certs:bootstrap

# 3. Iniciar servidor (porta 3001 HTTPS)
npm run dev

# 4. Executar todos os testes de segurança
cd server && npm run demo:security
# ou: node server/scripts/demo-security.mjs
```

---

## Task 1 & 2 — mTLS (Mutual TLS)

**Conceito:** O servidor exige que o cliente apresente um certificado assinado pela CA-CAMPUS.  
Um certificado falso ou sem a CA correcta é rejeitado com HTTP 403/401.

**Demonstração:**
```bash
node server/scripts/test-mtls.mjs
node server/scripts/test-wss-mtls.mjs
```

| Cenário | Cert usado | Resultado esperado |
|---------|-----------|-------------------|
| Sem certificado (dev) | — | 200 (localhost em allowlist) |
| Sem certificado (`MTLS_STRICT=true`) | — | 401 ❌ |
| `client.crt` assinado pela CA | clientAuth EKU | 200 ✅ |
| `servidor.crt` como client cert | Sem EKU clientAuth | 403 ❌ |
| WebSocket `/live` com `client.crt` | clientAuth EKU | Liga + fecha 1008 (JWT inválido no teste) ✅ |
| WebSocket com `servidor.crt` | Sem clientAuth | Rejeitado ❌ |

**Modo produção (`MTLS_STRICT`):**
```bash
# No server/.env:
MTLS_STRICT=true
# ou NODE_ENV=production (strict activo por defeito)

# Reiniciar servidor e testar:
node server/scripts/test-mtls.mjs
# Cenário 1 deve dar 401 sem certificado
```

**Instalar certificado de cliente no sistema (Electron / browser):**

Password do `client.p12`: `campus`

```bash
# Automático (detecta Windows / macOS / Linux):
cd server && npm run certs:import-p12

# Windows (PowerShell):
certutil -f -user -p campus -importpfx server\certs\client.p12

# macOS (Terminal):
security import server/certs/client.p12 -k ~/Library/Keychains/login.keychain-db -P campus -A

# Linux (requer libnss3-tools: sudo apt install libnss3-tools):
pk12util -i server/certs/client.p12 -d sql:$HOME/.pki/nssdb -W campus
```

**Ficheiros chave:**
- `server/scripts/bootstrap-certs.mjs` — gera CA, servidor, cliente e `client.p12`
- `server/certs/ca.crt` — Autoridade de Certificação
- `server/certs/client.crt` — Certificado de cliente (CN=campus-client)
- `server/certs/client.p12` — Pacote para Electron (password: `campus`)
- `server/src/security/peerCert.ts` — validação partilhada HTTP + WebSocket
- `server/src/middleware/clientCert.middleware.ts` — middleware HTTP
- `client/electron/tls.cjs` — verificação CA + cert de cliente no desktop
- `client/vite.config.ts` — proxy mTLS com CA-CAMPUS

---

## Task 2 — Acesso por Certificado (Dupla Camada)

**Conceito:** O CAMPUS usa **duas camadas** de autenticação:

1. **Camada dispositivo (mTLS)** — o certificado identifica *qual máquina* acede à API.
2. **Camada utilizador (JWT)** — o login identifica *quem* está a usar a aplicação.

Sem certificado válido (em `MTLS_STRICT`) → **401** antes de qualquer JWT ser avaliado.  
Com certificado mas sem JWT → rotas públicas OK; rotas protegidas → **401**.

```
Cliente                          Servidor CAMPUS
   │                                   │
   │── TLS + certificado cliente ─────►│  Camada 1: mTLS (dispositivo)
   │◄── servidor.crt (CA-CAMPUS) ──────│
   │                                   │
   │── POST /auth/login + JWT req ────►│  Camada 2: email/password → JWT
   │◄── { token, user, deviceAccess } ─│
   │                                   │
   │── GET /api/... Authorization ────►│  Camada 1 + 2 obrigatórias
```

**Demonstração:**
```bash
node server/scripts/test-cert-access.mjs
```

| Verificação | Resultado esperado |
|-------------|-------------------|
| Sem cert (strict) | 401 — bloqueado na camada 1 |
| Cert válido | 200 em `/api/health` |
| Cert + login | `deviceAccess.mode: certificate` |
| Cert sem JWT em `/profile` | 401 — camada 2 em falta |
| Cert + JWT em `/profile` | 200 — acesso completo |
| JWT sem cert (strict) | 401 — JWT não contorna mTLS |
| `/uploads` sem cert (strict) | 401 — media também protegida |

**Cabeçalhos de resposta (camada dispositivo):**
- `X-Campus-Device-Mode`: `certificate` ou `allowlist`
- `X-Campus-Client-CN`: nome do certificado (ex: `campus-client`)
- `X-Campus-Client-Fingerprint`: SHA-256 do dispositivo

**Produção:** `NODE_ENV=production` activa `MTLS_STRICT` automaticamente — sem allowlist de localhost.

**Ficheiros chave:**
- `server/src/security/deviceAccess.ts` — modelo da camada dispositivo
- `server/src/middleware/requireDeviceCertificate.ts` — publicação exige cert real em strict
- `GET /api/auth/access` — estado das duas camadas para a UI

---

## Task 3 — Não Repúdio (Assinatura Digital)

**Conceito:** Cada acção relevante é registada num log assinado digitalmente  
com RSA-SHA256 usando a chave privada do servidor. O utilizador não pode negar a acção.

**Acções com log assinado:**
- Login e registo (`auth.controller`)
- Publicação de podcast (`Publicou: {título}`)
- Download de episódio (`Download: {título}`)
- Acções no painel admin (`admin.service`)

**Demonstração:**
```bash
node server/scripts/test-nonrepudiation.mjs
```

**UI admin:** `/admin/logs` — colunas Certificado, Fingerprint, Assinatura (válida/inválida).

**O que verificar no resultado:**
- `cert_fingerprint` — identifica o dispositivo usado
- `cert_cn` — nome do certificado (CN=campus-client)
- `signature` — assinatura RSA-SHA256 em Base64
- `signature_valid: true` — integridade confirmada em tempo real

**Ficheiros chave:**
- `server/src/security/digitalSignature.ts` — `signLog()` / `verifyLog()`
- `server/src/models/log.model.ts` — `insertLog()` com assinatura
- `client/src/features/admin/pages/AdminLogsPage.tsx` — auditoria visual

---

## Task 4 — Gestão de CA

**Conceito:** A CA-CAMPUS é a única entidade que pode emitir certificados válidos.  
O servidor regista todos os certs emitidos e pode revogar qualquer um.

**Demonstração:**
```bash
node server/scripts/test-ca-management.mjs

# Emitir novo certificado para um dispositivo
node server/scripts/issue-client-cert.mjs pacavira-laptop pacavira@campus.co.ao
```

**UI admin:** `/admin/certs` — listar, registar fingerprint, revogar.

**Modo estrito opcional:** `CA_REQUIRE_REGISTRATION=true` — só dispositivos registados na BD acedem (além de válidos pela CA).

**Ficheiros chave:**
- `server/scripts/issue-client-cert.mjs` — emissão OpenSSL + registo API
- `server/scripts/test-ca-management.mjs` — teste automático
- `server/src/models/cert.model.ts` — registo, revogação, `isFingerprintRegistered`
- `client/src/features/admin/pages/AdminCertsPage.tsx` — gestão visual

---

## Task 5 — Protecção contra Pirataria

**Conceito:** Cada download fica ligado ao certificado do dispositivo que descarregou.  
Se o conteúdo vazar, rastreamos qual dispositivo (fingerprint) o distribuiu.

**Demonstração:**
```bash
node server/scripts/test-piracy-protection.mjs
```

**UI admin:** `/admin/piracy` — alertas de risco + histórico com fingerprint e IP.

**O que é registado por download:**
- `podcast_id`, `user_id`, `cert_fingerprint`, `cert_cn`, `ip_address`
- Log assinado `Download: {título}` (Task 3)

**Alertas:** episódios com mais de um download; risco alto se ≥3 dispositivos ou downloads sem cert.

**Ficheiros chave:**
- `server/src/models/download.model.ts` — `recordDownload()`, `detectPiracyAlerts()`
- `server/src/controllers/podcast.controller.ts` — endpoint download
- `client/src/features/admin/pages/AdminPiracyPage.tsx` — painel visual

---

## Task 6 — Validação de Autoria

**Conceito:** Cada podcast publicado guarda o fingerprint do certificado do autor.  
Qualquer pessoa pode verificar quem publicou o quê e com que dispositivo.

**Demonstração:**
```bash
node server/scripts/test-authorship.mjs
```

**UI:**
- `/podcasts/new` — painel «Autoria certificada» mostra o CN do dispositivo
- `/podcasts/:id` — badge de autoria certificada com fingerprint
- `/admin/posts` — coluna Autoria para auditoria

**Campos na BD:**
- `podcasts.author_cert_fingerprint` — fingerprint SHA256 do cert do autor
- `podcasts.author_cert_cn` — CN do certificado (ex: campus-client)

**Ficheiros chave:**
- `server/src/services/podcast.service.ts` — grava cert na publicação
- `client/src/features/podcasts/components/AuthorCertBadge.tsx` — badge visual

---

## Task 7 — Mitigação de Ataques MITM

**Conceito:** TLS com CA explícita impede ataques Man-in-the-Middle.  
Cert falso (do atacante) é rejeitado com erro TLS. HSTS impede downgrade para HTTP.

**Demonstração:**
```bash
node server/scripts/test-mitm-protection.mjs
```

| Cenário | CA usada | Resultado |
|---------|----------|-----------|
| A — Ligação legítima | CA-CAMPUS (correcta) | 200 ✅ |
| B — Sem verificação (-k) | Nenhuma | 200 ⚠️ VULNERÁVEL |
| C — CA do atacante (MITM) | CA falsa | TLS Error ✅ BLOQUEADO |
| D — HSTS | — | Cabeçalho presente ✅ |

**UI:** `/profile` → secção **Ligação segura (anti-MITM)** — protocolo, CA, HSTS, TLS mínimo.

**Camadas de protecção:**
1. TLS 1.2+ obrigatório (`minVersion`)
2. Cifras ECDHE (Perfect Forward Secrecy)
3. CA-CAMPUS como âncora de confiança (Vite `secure: true`, Electron `tls.cjs`)
4. mTLS — dupla autenticação
5. HSTS — sem downgrade para HTTP

**Ficheiros chave:**
- `server/src/app.ts` — helmet HSTS + cifras TLS
- `client/vite.config.ts` — proxy com `ca: ca.crt`
- `client/electron/tls.cjs` — verificação CA no desktop
- `client/src/features/profile/components/ProfileTlsSection.tsx` — painel visual

---

## Task 8 — Mecanismo de Excepção (Allowlist)

**Conceito:** Dispositivos sem certificado podem ser autorizados pelo admin via allowlist de IPs.  
Em produção a lista começa vazia. Em dev, localhost é incluído para o proxy Vite.

**Demonstração:**
```bash
node server/scripts/test-exception-mechanism.mjs
```

**UI admin:** `/admin/allowlist` — adicionar/remover IPs com motivo.

**API:**
```bash
POST /api/admin/allowlist  { "ip": "10.0.0.5", "reason": "Sala de aula" }
GET /api/admin/allowlist
DELETE /api/admin/allowlist/10.0.0.5
```

**Persistência:** tabela `mtls_allowlist` — sobrevive a reinícios do servidor.

**Ficheiros chave:**
- `server/src/models/allowlist.model.ts` — CRUD na BD
- `server/src/security/allowedClients.ts` — cache + `initAllowlistFromDb()`
- `client/src/features/admin/pages/AdminAllowlistPage.tsx` — painel visual

---

## Task 9 — Separação de Papéis (RBAC)

**Conceito:** O papel `admin` gere a plataforma mas **não** publica podcasts.  
Publicação e live broadcast são exclusivos do papel `creator`.

**Demonstração:**
```bash
node server/scripts/test-role-separation.mjs
```

| Papel | Pode fazer |
|-------|-----------|
| `admin` | Gerir users, logs, certs, streams; **editar/remover** podcasts (moderação) |
| `creator` | Publicar episódios (`POST /api/podcasts`) e transmitir live |
| `user` | Ouvir, descarregar, explorar |

**UI:**
- `/admin/users` — badges de papel + promoção a criador
- `/admin/posts` — moderação (sem formulário de criação)

**Promover utilizador a creator:**
```bash
PATCH /api/admin/users/:id  { "role": "creator" }
```

**Ficheiros chave:**
- `server/src/types/roles.ts` — `PUBLISHER_ROLES = ['creator']`
- `server/src/middleware/requireCreator.ts` — bloqueia admin na publicação
- `client/src/features/auth/utils/canPublish.ts` — espelha regra no frontend

---

## Task 10 — Demonstração Completa de Segurança

**Conceito:** Orquestrador que executa os 10 scripts de validação em sequência — ideal para a defesa oral.

**Demonstração:**
```bash
# Terminal 1
cd server && npm run dev

# Terminal 2
cd server && npm run demo:security
```

**O que corre (por ordem):**

| # | Script | Task |
|---|--------|------|
| 1 | `test-mtls.mjs` | mTLS HTTP |
| 2 | `test-cert-access.mjs` | Dispositivo + JWT |
| 3 | `test-wss-mtls.mjs` | mTLS WebSocket |
| 4 | `test-nonrepudiation.mjs` | Logs assinados |
| 5 | `test-ca-management.mjs` | CA emitir/revogar |
| 6 | `test-piracy-protection.mjs` | Anti-pirataria |
| 7 | `test-authorship.mjs` | Autoria certificada |
| 8 | `test-mitm-protection.mjs` | Protecção MITM |
| 9 | `test-exception-mechanism.mjs` | Allowlist |
| 10 | `test-role-separation.mjs` | RBAC |

**Pré-voo:** verifica `https://localhost:3001/api/health` antes de iniciar.  
**Resumo final:** tabela ✅/❌ por task; exit code 1 se algum script falhar.

**UI complementar (navegação durante a defesa):**
- `/admin/logs` · `/admin/certs` · `/admin/piracy` · `/admin/allowlist`
- `/admin/users` · `/admin/posts` · `/profile` (dispositivo + TLS)

---

## Arquitectura de Certificados

```
CA-CAMPUS (ca.crt / ca.key)
├── servidor.crt  — Certificado do servidor HTTPS (CN=localhost)
└── client.crt    — Certificado de cliente (CN=campus-client, EKU=clientAuth)
    └── pacavira-laptop.crt  — Emitido pela CA via issue-client-cert.mjs
```

**Fluxo mTLS:**
1. Cliente liga a `https://localhost:3001`
2. Servidor apresenta `servidor.crt` → cliente verifica contra `ca.crt`
3. Servidor pede `client.crt` → verifica EKU clientAuth + assinado pela CA
4. Se cert revogado → 403; se na allowlist → passa; se sem cert → 401

---

## Executar Demo Completa

Ver secção **Task 10** acima. Comando rápido:

```bash
cd server && npm run dev          # terminal 1
cd server && npm run demo:security  # terminal 2
```
