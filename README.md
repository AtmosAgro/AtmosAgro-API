# 🛰️ CanaVision API (AtmosAgro)

API Node.js de alto desempenho para orquestração de processamento de imagens de satélite e gestão agronômica. Desenvolvida com **Express**, **TypeScript**, **Prisma (PostgreSQL)** e integração nativa com **Google Cloud Storage**.

## 🚀 Funcionalidades Principais
- **Autenticação Multitenant:** Gestão de usuários e clientes via Supabase Auth com isolamento rigoroso de dados (`clienteId`).
- **Gestão Geoespacial:** CRUD de Propriedades e Talhões com suporte a geometrias complexas (PostGIS).
- **Entrega de Mapas:** Geração de **Signed URLs** para visualização e download de GeoTIFFs (NDVI, NDWI) armazenados no GCS.
- **Orquestração de Jobs:** Pipeline assíncrono para processamento de imagens Sentinel-2 via core Python.

## 🏗️ Estrutura do Projeto
- `src/api/` – Controladores, rotas e validadores (Zod) organizados por domínio.
- `src/services/` – Camada de lógica de negócio e orquestração.
- `src/repositories/` – Abstração de acesso ao banco via Prisma.
- `src/integrations/` – Conectores (GCS, SICAR, Supabase).
- `docs/` – Documentação detalhada dos endpoints (padrão Confluence).

## 🛠️ Setup do Ambiente

### Pré-requisitos
- Node.js LTS (v20+)
- PostgreSQL com extensões `postgis` e `uuid-ossp`
- Google Cloud SDK (autenticado) para acesso ao GCS

### Instalação
```bash
npm install

cp .env.example .env

npm run prisma:generate

npm run dev
```

### Configuração do Banco
O schema utiliza campos espaciais. Em qualquer ambiente novo, garanta as extensões:
```sql
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

## 📦 Variáveis de Ambiente Necessárias (.env)
| Variável | Descrição |
| :--- | :--- |
| `DATABASE_URL` | String de conexão PostgreSQL |
| `GCS_BUCKET` | Nome do bucket para armazenamento de GeoTIFFs |
| `SUPABASE_URL` | Endpoint do seu projeto Supabase |
| `SUPABASE_ANON_KEY` | Chave anônima para autenticação |
| `SUPABASE_JWT_SECRET` | Secret para validação de tokens |

## 📖 Documentação da API
A documentação detalhada de cada domínio pode ser encontrada em:
- `docs/api/Autenticacao/` - Fluxos de login e registro.
- `docs/api/Propriedades/` - Gestão de fazendas.
- `docs/api/Imagens/` - **Download e visualização de GeoTIFFs.**
- `docs/api/Talhoes/` - Subdivisões e áreas de plantio.

## 🐳 Docker e Deploy
A API está preparada para execução no **Google Cloud Run**.
```bash
# Build e Deploy via Cloud Build
gcloud builds submit --tag gcr.io/<PROJECT_ID>/canavision-api .

# Deploy Cloud Run
gcloud run deploy canavision-api --image gcr.io/<PROJECT_ID>/canavision-api
```

---
© 2026 AtmosAgro - Inteligência Geográfica para o Campo.
