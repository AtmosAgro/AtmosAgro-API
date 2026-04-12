# TODO - AtmosAgro API

## ✅ Concluído
- [x] Modelar banco (schema Prisma + extensões PostGIS / uuid-ossp).
- [x] Implementar Multitenancy (isolamento por `clienteId`) em Propriedades, Talhões e Artefatos.
- [x] Criar integração com GCS para Proxy/Stream (Artefatos).
- [x] Implementar Identificadores Semânticos (`propriedade-data-indice`) nos Artefatos.
- [x] Criar Documentação de Arquitetura (Regras de Negócio, Tenancy, DTOs e Semântica).
- [x] Criar script de Seed robusto para Usina Moreno (Mocks).

## 🚀 Próximos Passos (Artefatos & Pipeline)
- [x] Implementar DTOs reais no código para ocultar campos internos (`caminho`). *(campo removido do response — Abril/2026)*
- [ ] Criar Validadores (Zod) para os novos campos de busca.
- [x] Avaliar transição de Proxy Stream para Signed URLs diretas. *(implementado `GET /:id/signed-url` — Abril/2026)*

## 🚀 Próximos Passos (Pipeline de Imagens)
- [ ] Implementar endpoints de gestão do Pipeline (`POST /api/pipeline`, `GET /status`).
- [ ] Criar rotas internas de comunicação com Worker (`GET /internal/pipeline/next`).
- [ ] Desenvolver script de loop (Pull Model) no Core Python.
- [ ] Integrar callback de sucesso do Python com a tabela `Artefato`.
- [ ] Validar fluxo ponta a ponta (E2E) do Pipeline.

## ⏳ Médio/Longo Prazo
- [ ] Detalhar fluxo de ingestão SICAR (fontes, rate limits, armazenamento).
- [ ] Implementar sistema de Alertas e Notificações.
- [ ] Adicionar suporte a outros índices (NDWI, SAVI, EVI).
- [ ] Configurar Dashboard administrativo de Clientes.
- [ ] Definir estratégia de deploy e observabilidade mínima (logs, métricas, alertas).
