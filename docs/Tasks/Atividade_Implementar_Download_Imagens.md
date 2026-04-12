# 📋 Atividade: Implementação de Endpoints para Download e View de GeoTIFFs

| ID | Status | Prioridade | Responsável |
| :--- | :--- | :--- | :--- |
| TASK-005 | ✅ CONCLUÍDO | ALTA | Lucas |

> **Concluído em: Abril/2026**

## 1. Objetivo

Disponibilizar endpoints seguros na API Node.js para que o Frontend possa visualizar arquivos GeoTIFF armazenados no Google Cloud Storage (GCS) via **Signed URLs temporárias**, garantindo isolamento por cliente (multitenancy).

---

## 2. Requisitos Técnicos

- **Segurança (Tenancy):** O `clienteId` vinculado ao usuário logado é validado contra o `clienteId` da `Propriedade` associada ao `Artefato`. ✅
- **Integridade:** O campo `caminho` (path interno do GCS) não é exposto na API. ✅
- **Performance:** URLs com expiração de 15 minutos geradas via GCS SDK V4. ✅
- **Identificador Semântico:** Todos os endpoints aceitam UUID ou identificador `{8chars}-{YYYYMMDD}-{INDICE}`. ✅

---

## 3. Checklist de Implementação

### ✅ Fase 1: Camada de Dados (Repository)
- [x] `ArtefatosRepository.findById` com inclusão de hierarquia (`talhao → propriedade → clienteId`).

### ✅ Fase 2: Lógica de Negócio (Service)
- [x] `ArtefatosService.getSignedUrl(id, authClienteId)` — gera Signed URL V4, valida tenancy, retorna `{ signedUrl, expiresAt }`.
- [x] `ArtefatosService.formatResponse()` — remove `caminho` do response, gera identificador automático a partir do path GCS, extrai `dataReferencia` e `indice` como fallback.
- [x] `src/utils/artefatos.utils.ts` — `parseCaminho()` e `gerarIdentificador()` com parse do padrão `processed/{propriedadeId}/{YYYY-MM-DD}_{INDICE}.tif`.

### ✅ Fase 3: Interface (Controller & Routes)
- [x] `ArtefatosController.getSignedUrl` — handler para `GET /:id/signed-url`.
- [x] `ArtefatosController.download` — proxy stream (fallback).
- [x] Rotas registradas: `GET /:id/signed-url` e `GET /:id/download`.

### ✅ Fase 4: Frontend
- [x] `web/src/services/artefatos.ts` — `listArtefatosByPropriedade`, `getArtefatoSignedUrl`, `formatArtefatoLabel`, `parseIdentificador`.
- [x] `InteractiveMap.tsx` — carregamento de GeoTIFF via API (sem upload manual obrigatório), seção "Imagens Disponíveis" no painel do talhão.

### 🔴 Fase 5: Validação (Pendente)
- [ ] Teste: artefato existente com cliente correto → 200 + Signed URL.
- [ ] Teste: artefato de outro cliente → 403.
- [ ] Teste: ID inexistente → 404.
- [ ] Configurar CORS no bucket GCS (`gsutil cors set cors.json gs://atmos-agro-data-lake-dev`).

---

## 4. Definição de Pronto (DoD)

- [x] Código compilando (pendente `prisma generate` para erros de tipo pré-existentes).
- [x] Endpoints respondendo conforme `docs/api/Artefatos/`.
- [x] Campo `caminho` não exposto no frontend.
- [ ] Testes de tenancy implementados.
- [ ] CORS do GCS configurado em produção.

---

## 5. Convenção de Armazenamento GCS

```
Bucket:  atmos-agro-data-lake-dev  (prod: atmos-agro-data-lake)
Caminho: processed/{propriedadeId}/{YYYY-MM-DD}_{INDICE}.tif

Exemplo:
  processed/8cc63dfa-42c9-4b84-a950-72077b283435/2025-12-29_NDVI.tif
```

## 6. Riscos / Pendências

| Item | Status |
|---|---|
| CORS no bucket GCS | ⚠️ Pendente — necessário para `fetch(signedUrl)` no browser |
| `prisma generate` para erros de tipo | ⚠️ Pendente — tipos de relações Prisma desatualizados |
| Testes automatizados de tenancy | ❌ Não implementado |
