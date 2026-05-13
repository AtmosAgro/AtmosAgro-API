# Avaliação Técnica — CanaVision API

> Branch: `release_00.00.01` | Gerado em: 2026-03-13 | Último commit: `9806de6`

---

## 1. Identificação do Sistema

**Nome:** CanaVision API (internamente "Atmos")
**Domínio:** Processamento e análise de imagens de satélite para monitoramento de lavouras de cana-de-açúcar
**Stack:** Node.js 20 + TypeScript + Express + Prisma + PostgreSQL (Supabase) + Redis + GCS
**Versão alvo:** 0.0.1 — primeira release candidata
**Arquitetura:** REST API multi-tenant com pipeline assíncrono de processamento de imagens via BullMQ + worker Python

### Diferencial desta branch em relação à `main`
Esta branch introduz mudanças arquiteturais significativas no módulo de Artefatos:
- **Proxy/Stream** substitui **Signed URLs diretas** — API atua como intermediária nos downloads
- **Identificadores semânticos** nos artefatos (`{PROP_ID}-{DATA}-{INDICE}`)
- **Relação direta** `Artefato → Propriedade` (antes apenas via Talhão)
- **Documentação de design** extensiva (multitenancy, DTOs, nomenclatura, regras de negócio)
- **Scripts de seed** completos com dados de mock para testes

### Fluxo macro do produto
```
Frontend → API (Node.js) → Job Queue (BullMQ/Redis)
                               ↓
                         Worker (Python/Core)
                         [Sentinel-2 → GeoTIFF → índices NDVI/NDWI/...]
                               ↓
                         Google Cloud Storage
                               ↓
                    API Stream proxy (GET /artefatos/:id/download)
                               ↓
                            Usuário
```

---

## 2. Estado Atual — O que está pronto

| Módulo | Status | Observação |
|---|---|---|
| Autenticação (Supabase + JWT + cookies) | ✅ 100% | Sólido, HTTP-only cookies, secure |
| CRUD Propriedades | ✅ 95% | Funcional com multi-tenancy |
| CRUD Talhões | ✅ 95% | Funcional com validação de propriedade |
| Artefatos — listagem por propriedade | ✅ 90% | Funcional |
| Artefatos — listagem geral por cliente | ✅ 85% | Novo endpoint, funcional |
| Artefatos — metadata + URL proxy | ✅ 85% | Substituiu signed URL |
| Artefatos — download via stream (proxy) | ✅ 80% | GCS stream através da API |
| Identificadores semânticos | ✅ 90% | Campo `identificador` único |
| Relação Artefato → Propriedade | ✅ 100% | 3 migrations aplicadas |
| Schema do banco (PostGIS) | ✅ 100% | 13 modelos, indexes espaciais |
| Multi-tenancy (clienteId) | ⚠️ 70% | Lógica OK, mas cliente hardcoded no registro |
| Pipeline / Jobs | ❌ 10% | BullMQ stub, sem implementação |
| Alertas | ❌ 5% | Apenas skeleton |
| SICAR Integration | ❌ 5% | Apenas skeleton |
| DTOs formalizados | ⚠️ 50% | Documentados, não totalmente implementados em código |
| Validators Zod para artefatos | ⚠️ 40% | Não criados ainda |
| Testes | ❌ 0% | Framework pronto, zero testes |
| Observabilidade | ⚠️ 40% | Pino logs, sem métricas/tracing |
| Produção-readiness | ⚠️ 45% | Proxy stream é mais seguro; faltam rate limit, pooling |

---

## 3. Análise de Segurança

### 3.1 Pontos positivos
- **HTTP-only cookies** para tokens JWT — protege contra XSS
- **SameSite=Strict + Secure** em produção — protege contra CSRF
- **Helmet.js** — headers de segurança padrão
- **CORS** configurável por env var
- **Zod** em todas as entradas de rotas principais
- **Supabase JWT** validado em toda rota protegida
- **Status do usuário verificado** no middleware — usuários bloqueados rejeitados
- **Proxy Stream de downloads** — oculta estrutura do bucket GCS do frontend (melhoria vs `main`)
- **Validação de tenancy em dois níveis** — `artefato → propriedade → clienteId` e `artefato → talhao → propriedade → clienteId`

### 3.2 Vulnerabilidades e riscos

#### 🔴 Crítico

**SEC-01 — Client ID hardcoded em auth.service.ts**
```typescript
// src/services/auth/auth.service.ts
const DEFAULT_TEST_CLIENT_ID = '1a5845b7-3622-4eaa-9ed3-cec2b25f4aa7';
```
- **Risco:** Todos os usuários novos criados no mesmo tenant de teste
- **Impacto:** Isolamento de dados completamente comprometido em produção
- **Correção:** Exigir `clienteId` no registro ou criar fluxo de onboarding de cliente

**SEC-02 — Sem rate limiting nas rotas de auth**
- Nenhum middleware de rate limit em `/auth/login`, `/auth/forgot-password`
- **Risco:** Brute-force em credenciais, abuso de envio de e-mail
- **Correção:** `express-rate-limit` + Redis para janelas deslizantes

#### 🟡 Alto

**SEC-03 — Proxy stream sem limite de tamanho de arquivo**
- `GET /artefatos/:id/download` faz stream direto do GCS para o cliente
- Arquivos GeoTIFF podem ter centenas de MB
- **Risco:** Um único download pode saturar recursos do servidor (Cloud Run = sem disco local, mas memória/CPU)
- **Correção:** Verificar tamanho do arquivo antes de stremar; implementar limite configurável

**SEC-04 — Sem trilha de auditoria ativa**
- Tabela `Auditoria` existe no schema mas nunca é escrita
- **Risco:** Sem rastreabilidade de downloads, acessos e mutações (LGPD)
- **Correção:** Middleware ou hooks Prisma para registrar mutações e downloads

**SEC-05 — SUPABASE_SERVICE_ROLE_KEY exposto no processo Node.js**
- Chave de serviço (admin ilimitado) carregada via env e usada diretamente
- **Risco:** Leak de variáveis de ambiente compromete toda a instância Supabase
- **Melhoria:** Isolar chamadas com service role em módulo restrito

**SEC-06 — Identificador semântico previsível**
- Padrão: `{PROP_SHORT_ID}-{DATA}-{INDICE}` (ex: `8cc63dfa-20260308-NDVI_TOTAL`)
- **Risco:** Com acesso a um identificador, é possível deduzir outros
- **Avaliação:** Baixo risco se a validação de tenancy for rigorosa (e está); monitorar

#### 🟠 Médio

**SEC-07 — Validators Zod ausentes em endpoints de artefatos**
- Queries de listagem sem validação de parâmetros (ex: `propriedadeId`)
- **Risco:** Parâmetros malformados podem causar erros não tratados

**SEC-08 — Sem cabeçalho `Content-Disposition` controlado no download**
- Verificar que o stream retorna o filename correto para evitar path traversal no cliente

---

## 4. Análise de Performance

### 4.1 Pontos positivos
- **PostGIS com índices GIST** — queries espaciais eficientes
- **Pino** — logger de altíssima performance
- **Identificadores semânticos** — permitem lookup por identificador legível sem SCAN
- **Seed scripts** completos — facilitam testes de carga realistas

### 4.2 Gargalos e riscos

#### 🔴 Crítico

**PERF-01 — Proxy stream para downloads GeoTIFF**
- A mudança de signed URL para proxy stream tem implicações sérias de performance:
  - GeoTIFFs podem ter 100MB–1GB
  - Cloud Run tem timeout de ~60s por request (configurável até 3600s)
  - Cada download ocupa uma conexão + memória do servidor
- **Risco:** Com múltiplos downloads simultâneos, instâncias Cloud Run podem escalar indevidamente ou esgotar recursos
- **Recomendação:** Considerar **signed URLs** para arquivos grandes + proxy apenas para controle de acesso inicial

```
Opção híbrida:
GET /artefatos/:id/download
  → Valida autenticação + tenancy
  → Retorna redirect 302 para signed URL temporária (15min)
  → Browser baixa direto do GCS sem passar pela API
```

**PERF-02 — Sem connection pooling configurado**
- Prisma em Cloud Run pode abrir muitas conexões ao PostgreSQL
- **Risco:** Esgotamento de conexões sob carga
- **Correção:** `connection_limit` no `DATABASE_URL` ou PgBouncer

#### 🟡 Alto

**PERF-03 — Queries de listagem de artefatos sem paginação**
- `GET /api/artefatos` lista TODOS os artefatos do cliente sem limite
- Clientes com centenas de imagens carregam tudo de uma vez
- **Risco:** Queries lentas, payloads enormes
- **Correção:** Parâmetros `page` + `limit` + cursor pagination

**PERF-04 — N+1 queries no include aninhado**
- `findByClienteId` faz include de `talhao → propriedade` em cada artefato
- **Risco:** N queries extras para N artefatos
- **Verificar:** Prisma consolida em JOIN ou faz múltiplas queries

**PERF-05 — Sem compressão HTTP**
- Não há `compression` middleware no Express
- **Risco:** Respostas JSON de listagens sem gzip
- **Correção:** `npm install compression`

#### 🟠 Médio

**PERF-06 — Índices de banco ausentes**
- `clienteId`, `Job.status`, `Artefato.identificador` precisam de índices explícitos
- `identificador` tem constraint `UNIQUE` (que cria índice implícito) ✅
- Verificar os demais:

```sql
CREATE INDEX idx_propriedade_clienteid ON "Propriedade"("clienteId");
CREATE INDEX idx_talhao_propriedadeid ON "Talhao"("propriedadeId");
CREATE INDEX idx_artefato_propriedadeid ON "Artefato"("propriedadeId");
CREATE INDEX idx_artefato_talhaoid ON "Artefato"("talhaoId");
CREATE INDEX idx_job_status ON "Job"("status");
CREATE INDEX idx_job_clienteid ON "Job"("clienteId");
```

**PERF-07 — Redis opcional sem fallback gracioso**
- BullMQ depende de Redis; se Redis ausente, workers não iniciam silenciosamente
- **Correção:** Health check de Redis em `/health`

---

## 5. Qualidade de Código e Arquitetura

### 5.1 Pontos positivos desta branch
- **Documentação de design extensiva** — multitenancy, DTOs, nomenclatura, regras de negócio
- **Identificadores semânticos** — padrão bem definido e documentado
- **Separação clara** — controller → service → repository
- **Path aliases TypeScript** — tsconfig.json na raiz resolve aliases corretamente
- **Scripts de seed realistas** — facilita desenvolvimento e testes manuais
- **Validação de tenancy em dois níveis** — mais robusta que a `main`

### 5.2 Débitos técnicos

**DT-01 — Zero testes**
- Framework Jest configurado mas nenhum teste implementado
- Sem cobertura de multi-tenancy, auth middleware, proxy stream
- **Prioridade:** Alta — o módulo de artefatos foi refatorado sem testes de regressão

**DT-02 — DTOs não totalmente implementados**
- `docs/design/Padrao_Respostas_DTOs.md` documenta o padrão
- Código ainda retorna dados brutos com formatação ad-hoc no service
- **Risco:** Inconsistências nas respostas; dificuldade de manutenção

**DT-03 — Validators Zod ausentes em artefatos**
- Parâmetros de query (`page`, `limit`, `propriedadeId`) não validados
- **Correção:** Criar validators no diretório `src/api/validators/`

**DT-04 — Core Python Integration é TODO**
```typescript
// src/integrations/core/workflow.client.ts
// TODO: implementar integração com core Python
```
- Pipeline completo não funciona em nenhuma branch

**DT-05 — Sem injeção de dependência**
- Services instanciam seus próprios repositories: `new PropriedadeRepository()`
- Dificulta mock em testes

**DT-06 — Falta OpenAPI/Swagger**
- Docs de endpoints em markdown (`/docs/api/`) mas sem spec automática
- **Opção:** `zod-to-openapi` aproveitando os schemas Zod já existentes

**DT-07 — Arquivo de screenshot na raiz**
- `Captura de tela 2026-03-12 151936.png` commitado na raiz do projeto
- **Correção:** Remover e adicionar `*.png` ao `.gitignore`

---

## 6. Novidades desta branch vs `main`

| Feature | Main | Release 00.00.01 |
|---|---|---|
| Download via Signed URL | ✅ | Substituído |
| Download via Proxy Stream | ❌ | ✅ Novo |
| Identificadores semânticos (`identificador`) | ❌ | ✅ Novo |
| Relação direta `Artefato → Propriedade` | ❌ | ✅ Novo (3 migrations) |
| `dataReferencia` no Artefato | ❌ | ✅ Novo |
| `GET /artefatos` (listar todos por cliente) | ❌ | ✅ Novo |
| Docs de design (multitenancy, DTOs, etc.) | Básico | ✅ Extenso |
| Scripts de seed completos | Básico | ✅ Completo |
| tsconfig.json na raiz | ❌ | ✅ Novo |

---

## 7. Plano de Ação

### Priorização por impacto/risco

| ID | Título | Prioridade | Tipo | Esforço |
|---|---|---|---|---|
| P-01 | Remover client ID hardcoded + fluxo de onboarding | 🔴 Crítico | Segurança | Médio |
| P-02 | Rate limiting nas rotas de auth | 🔴 Crítico | Segurança | Pequeno |
| P-03 | Avaliar proxy stream vs signed URL para GeoTIFFs grandes | 🔴 Crítico | Performance | Pequeno |
| P-04 | Connection pooling no DATABASE_URL | 🔴 Crítico | Performance | Trivial |
| P-05 | Paginação nos endpoints de listagem de artefatos | 🟡 Alto | Performance | Médio |
| P-06 | Validators Zod para endpoints de artefatos | 🟡 Alto | Qualidade | Médio |
| P-07 | DTOs formalizados no código (não só documentados) | 🟡 Alto | Qualidade | Médio |
| P-08 | Ativar tabela Auditoria (Prisma middleware) | 🟡 Alto | Segurança | Médio |
| P-09 | Adicionar índices de banco faltantes | 🟡 Alto | Performance | Pequeno |
| P-10 | Escrever testes de integração (auth, multi-tenancy, artefatos) | 🟡 Alto | Qualidade | Grande |
| P-11 | Implementar endpoints de Jobs + contrato com worker | 🔴 Crítico | Feature | Grande |
| P-12 | Integração Core Python (workflow.client.ts) | 🟡 Alto | Feature | Grande |
| P-13 | Compressão HTTP (gzip) | 🟠 Médio | Performance | Trivial |
| P-14 | Health check com DB + Redis + GCS | 🟠 Médio | Operações | Pequeno |
| P-15 | Graceful shutdown (SIGTERM) | 🟠 Médio | Operações | Pequeno |
| P-16 | Remover arquivo screenshot da raiz + .gitignore | 🟠 Médio | Qualidade | Trivial |
| P-17 | OpenAPI spec via zod-to-openapi | 🟠 Médio | DX | Médio |
| P-18 | Sistema de Alertas | 🟢 Baixo | Feature | Grande |
| P-19 | SICAR Integration | 🟢 Baixo | Feature | Grande |
| P-20 | Dashboard de Clientes e Usuários | 🟢 Baixo | Feature | Grande |

---

## 8. Roadmap para Release 0.0.1

### Pré-release — Blockers obrigatórios (antes de qualquer deploy)
- [ ] **P-01** Remover `DEFAULT_TEST_CLIENT_ID` — mínimo: variável de env com default de dev
- [ ] **P-02** Rate limiting em `/auth/login` e `/auth/forgot-password`
- [ ] **P-03** Definir estratégia definitiva de download (proxy vs signed URL com redirect)
- [ ] **P-04** `DATABASE_URL` com `connection_limit` configurável
- [ ] **P-06** Validators Zod para endpoints de artefatos
- [ ] **P-16** Remover screenshot da raiz

### Release 0.0.1 — Escopo atual com qualidade mínima
- [ ] **P-05** Paginação nos endpoints de listagem
- [ ] **P-07** DTOs formalizados no código
- [ ] **P-09** Migrations com índices de performance
- [ ] **P-13** Middleware `compression`
- [ ] **P-14** `/api/health` verificar DB + Redis + GCS
- [ ] **P-15** Graceful shutdown

### Pós-release 0.0.1 — Próximas versões
- [ ] **P-10** Testes de integração
- [ ] **P-08** Auditoria ativa
- [ ] **P-11** Pipeline de Jobs completo
- [ ] **P-12** Integração Core Python
- [ ] **P-17** OpenAPI spec

---

## 9. Decisão Arquitetural Recomendada — Download de Artefatos

Esta branch mudou de Signed URL para Proxy Stream. Avaliar cuidadosamente:

### Opção A — Proxy completo (atual)
```
Cliente → GET /artefatos/:id/download → API → GCS stream → Cliente
```
**Prós:** Controle total, GCS oculto, logs de download, revogar acesso instantâneo
**Contras:** Toda banda passa pela API, Cloud Run escala por download, timeouts em arquivos grandes

### Opção B — Redirect para Signed URL (recomendado para arquivos grandes)
```
Cliente → GET /artefatos/:id/download
  → API valida auth + tenancy
  → Retorna 302 redirect para signed URL (TTL: 5min, single-use)
Cliente → Download direto do GCS (sem passar pela API)
```
**Prós:** Sem carga no servidor, sem timeout, escala ilimitada
**Contras:** URL temporária visível, estrutura GCS potencialmente deduzível

### Opção C — Híbrido (melhor dos dois mundos)
- Arquivos pequenos (PNG, CSV, JSON < 10MB): Proxy stream
- Arquivos grandes (GeoTIFF > 10MB): Redirect para signed URL

**Recomendação:** Opção B para esta release (simplicidade + escala); evoluir para C quando necessário.

---

## 10. Arquivos-chave para referência

| Arquivo | Propósito |
|---|---|
| `src/services/auth/auth.service.ts` | Client ID hardcoded — P-01 |
| `src/services/artefatos/artefatos.service.ts` | Proxy stream + identificadores semânticos |
| `src/repositories/artefatos/artefatos.repository.ts` | Queries por clienteId, propriedadeId, identificador |
| `src/integrations/storage/storage.client.ts` | `getReadStream()` — novo método de stream |
| `src/integrations/core/workflow.client.ts` | Core Python TODO |
| `src/config/env.ts` | Validação de env vars |
| `src/middlewares/auth.middleware.ts` | JWT + cookie auth |
| `prisma/schema.prisma` | Schema com novas colunas de Artefato |
| `prisma/migrations/` | 3 novas migrations desta branch |
| `docs/design/Multitenancy_Isolamento.md` | Arquitetura de isolamento |
| `docs/design/Padrao_Respostas_DTOs.md` | Padrão de DTOs |
| `docs/design/Semantica_Padroes_Nomenclatura.md` | Padrão de identificadores |
| `scripts/seed-usina-moreno.ts` | Seed completo com dados de mock |

---

*Documento gerado por análise estática da branch `release_00.00.01`. Revisar junto ao time antes de priorizar.*
