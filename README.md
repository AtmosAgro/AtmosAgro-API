# AtmosAgro-API

Backend REST multitenant da plataforma AtmosAgro — Node.js + TypeScript + Express + Prisma. Cuida de autenticação, gestão geoespacial (Propriedades/Talhões PostGIS), catálogo de artefatos GeoTIFF e orquestração dos jobs de processamento Sentinel-2 (dispara o `AtmosAgro-Core` via fila BullMQ e processa o callback).

> **Arquitetura completa:** [AtmosAgro-API — Arquitetura](https://atmosagro.atlassian.net/wiki/spaces/AT/pages/37715970/AtmosAgro-API+Arquitetura) (Confluence)
> **Reference de endpoints (Artefatos):** [API Reference — Artefatos](https://atmosagro.atlassian.net/wiki/spaces/AT/pages/37748737/API+Reference+Artefatos)

## Stack

Node 20+, TypeScript, Express, Prisma 5, PostgreSQL 15 + PostGIS (via Supabase), Redis 7 + BullMQ, Google Cloud Storage, Supabase Auth, Zod, Pino, Jest.

## Quickstart local

```bash
npm install
cp .env.example .env   # preencha conforme abaixo
npm run prisma:generate
npm run dev            # ts-node-dev na porta 8080
```

### Subindo Postgres + Redis localmente

```bash
docker-compose up
```

### Variáveis obrigatórias no `.env`

- `DATABASE_URL` (Postgres com PostGIS)
- `REDIS_URL` (Redis 7)
- `CORE_BASE_URL`, `CORE_SERVICE_TOKEN` (integração com AtmosAgro-Core)
- `API_BASE_URL` (URL pública desta API, usada pelo Core nos callbacks)
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_PASSWORD_RESET_REDIRECT`, `SUPABASE_JWT_SECRET`

Para dev sem GCS, use `STORAGE_DRIVER=local` (signed URL fica indisponível; só funciona o stream proxy via `LOCAL_STORAGE_PATH`).

Lista completa de env vars no [Confluence (seção 9)](https://atmosagro.atlassian.net/wiki/spaces/AT/pages/37715970/AtmosAgro-API+Arquitetura).

## Scripts

```bash
npm run dev            # watch mode (ts-node-dev)
npm run build          # tsc
npm run start          # roda dist/
npm run lint           # eslint
npm run format         # prettier
npm test               # jest (sem testes ainda)
npm run prisma:generate
npm run prisma:migrate
```

### Scripts de seed (em `scripts/`)

```bash
ts-node scripts/seed-roles.ts
ts-node scripts/seed-usina-moreno.ts   # cliente + propriedade + talhões de demo
ts-node scripts/mock-artefatos.ts      # artefatos fake para a Usina Moreno
```

## Endpoints (resumo)

| Domínio | Auth | Rotas |
| --- | --- | --- |
| `/api/auth` | pública | register, login, logout, refresh-token, forgot-password, reset-password |
| `/api/propriedades` | cookie | CRUD + `:id/talhoes` |
| `/api/talhoes` | cookie | CRUD |
| `/api/artefatos` | cookie | list, byPropriedade, byId, signed-url, download |
| `/api/jobs` | cookie | create, list, getById |
| `/api/jobs/:id/{complete,fail}` | `x-service-token` | callbacks do Core |
| `/api/health` | pública | liveness simples |

Detalhes (request/response/exemplos) no Confluence.

## Layout

```
src/
├── api/              # Routes + Controllers + Validators (Zod)
├── services/         # Regra de negócio + multitenancy
├── repositories/     # Prisma (queries scoped por clienteId)
├── integrations/     # supabase / storage(GCS) / core / sicar
├── middlewares/      # auth (cookie JWT), service-token, validation, error-handler
├── workers/          # BullMQ Worker + Queue + Processor (fila satellite-jobs)
├── domain/ dtos/ events/  # tipos, contratos de resposta, emitters
├── config/           # env.ts (Zod-validated), logger (Pino)
└── app.ts server.ts  # bootstrap Express
```

Path aliases (`@api/*`, `@services/*`, etc.) configurados em `tsconfig.json`.

## Deploy

Containerizado via `Dockerfile`. Alvo de produção: **Google Cloud Run**.

```bash
gcloud builds submit --tag gcr.io/<PROJECT_ID>/atmos-api .
gcloud run deploy atmos-api --image gcr.io/<PROJECT_ID>/atmos-api
```
