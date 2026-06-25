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

# 2. Iniciar servidor (porta 3001 HTTPS)
cd server && npm run dev

# 3. Executar todos os testes de segurança
node server/scripts/demo-security.mjs
```

---

## Task 1 & 2 — mTLS (Mutual TLS)

**Conceito:** O servidor exige que o cliente apresente um certificado assinado pela CA-CAMPUS.  
Um certificado falso ou sem a CA correcta é rejeitado com HTTP 403/401.

**Demonstração:**
```bash
node server/scripts/test-mtls.mjs
```

| Cenário | Cert usado | Resultado esperado |
|---------|-----------|-------------------|
| Sem certificado | — | 200 (localhost em allowlist dev) |
| `client.crt` assinado pela CA | clientAuth EKU | 200 ✅ |
| `servidor.crt` como client cert | Sem EKU clientAuth | 403 ❌ |

**Ficheiros chave:**
- `server/certs/ca.crt` — Autoridade de Certificação
- `server/certs/client.crt` — Certificado de cliente (CN=campus-client)
- `server/src/middleware/clientCert.middleware.ts` — lógica de verificação

---

## Task 3 — Não Repúdio (Assinatura Digital)

**Conceito:** Cada acção (login, publicação, gestão) é registada num log assinado digitalmente  
com RSA-SHA256 usando a chave privada do servidor. O utilizador não pode negar a acção.

**Demonstração:**
```bash
node server/scripts/test-nonrepudiation.mjs
```

**O que verificar no resultado:**
- `cert_fingerprint` — identifica o dispositivo usado
- `cert_cn` — nome do certificado (CN=campus-client)
- `signature` — assinatura RSA-SHA256 em Base64
- `signature_valid: true` — integridade confirmada

**Ficheiros chave:**
- `server/src/security/digitalSignature.ts` — `signLog()` / `verifyLog()`
- `server/src/models/log.model.ts` — `insertLog()` com assinatura

---

## Task 4 — Gestão de CA

**Conceito:** A CA-CAMPUS é a única entidade que pode emitir certificados válidos.  
O servidor regista todos os certs emitidos e pode revogar qualquer um.

**Demonstração:**
```bash
# Emitir novo certificado para um dispositivo
node server/scripts/issue-client-cert.mjs pacavira-laptop pacavira@campus.co.ao

# Ver certs registados
curl -k -H "Authorization: Bearer <token>" https://localhost:3001/api/admin/certs

# Revogar um cert (acesso bloqueado imediatamente)
curl -k -X DELETE -H "Authorization: Bearer <token>" https://localhost:3001/api/admin/certs/1/revoke
```

**Ficheiros chave:**
- `server/scripts/issue-client-cert.mjs` — emissão automatizada
- `server/src/models/cert.model.ts` — registo e revogação

---

## Task 5 — Protecção contra Pirataria

**Conceito:** Cada download fica ligado ao certificado do dispositivo que descarregou.  
Se o conteúdo aparecer noutro lugar, rastreamos qual cert (dispositivo) o partilhou.

**Demonstração:**
```bash
node server/scripts/test-piracy-protection.mjs

# Ver histórico de downloads
GET /api/admin/downloads

# Ver análise de padrões suspeitos
GET /api/admin/piracy-alerts
```

**Ficheiros chave:**
- `server/src/models/download.model.ts` — `recordDownload()`, `detectPiracyAlerts()`
- `server/src/controllers/podcast.controller.ts` — download regista cert info

---

## Task 6 — Validação de Autoria

**Conceito:** Cada podcast publicado guarda o fingerprint do certificado do autor.  
Qualquer pessoa pode verificar quem publicou o quê e com que dispositivo.

**Demonstração:**
```bash
node server/scripts/test-authorship.mjs

# Ver campo author_cert_fingerprint na resposta
GET /api/podcasts
```

**Campos na BD:**
- `podcasts.author_cert_fingerprint` — fingerprint SHA256 do cert do autor
- `podcasts.author_cert_cn` — CN do certificado (ex: campus-client)

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

**Camadas de protecção:**
1. TLS 1.2+ obrigatório (`minVersion`)
2. Cifras ECDHE (Perfect Forward Secrecy)
3. CA-CAMPUS como âncora de confiança
4. mTLS — dupla autenticação
5. HSTS — sem downgrade para HTTP

---

## Task 8 — Mecanismo de Excepção (Allowlist)

**Conceito:** Dispositivos sem certificado podem ser autorizados pelo admin via allowlist de IPs.  
Em produção a lista começa vazia. Em dev, localhost está incluído para o proxy Vite.

**Demonstração:**
```bash
node server/scripts/test-exception-mechanism.mjs

# Adicionar IP
POST /api/admin/allowlist  { "ip": "10.0.0.5", "reason": "Sala de aula" }

# Ver allowlist
GET /api/admin/allowlist

# Remover IP
DELETE /api/admin/allowlist/10.0.0.5
```

---

## Task 9 — Separação de Papéis (RBAC)

**Conceito:** O papel `admin` gere a plataforma mas NÃO pode publicar podcasts.  
Publicação é exclusiva do papel `creator`. Tentativa de admin publica → 403.

**Demonstração:**
```bash
node server/scripts/test-role-separation.mjs
```

| Papel | Pode fazer |
|-------|-----------|
| `admin` | Gerir users, ver logs, emitir/revogar certs, gerir streams |
| `creator` | Publicar e editar os seus podcasts |
| `user` | Ouvir, descarregar, ver podcasts |

**Promover utilizador a creator:**
```bash
PATCH /api/admin/users/:id  { "role": "creator" }
```

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

```bash
# Iniciar servidor
cd server && npm run dev

# Noutro terminal — correr todos os testes
node server/scripts/demo-security.mjs
```
