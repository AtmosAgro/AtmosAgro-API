# Convenção de Armazenamento — Google Cloud Storage

> **Status:** ✅ Implementado (Abril/2026)

Este documento define as regras de nomenclatura de arquivos no GCS e o padrão de identificadores semânticos usados na API e no frontend.

---

## 1. Estrutura do Bucket

```
Bucket (dev):  atmos-agro-data-lake-dev
Bucket (prod): atmos-agro-data-lake

Caminho:       processed/{propriedadeId}/{YYYY-MM-DD}_{INDICE}.tif
```

### Exemplo real
```
processed/8cc63dfa-42c9-4b84-a950-72077b283435/2025-12-29_NDVI.tif
processed/8cc63dfa-42c9-4b84-a950-72077b283435/2025-12-29_NDWI.tif
processed/8cc63dfa-42c9-4b84-a950-72077b283435/2026-03-08_NDVI.tif
```

### Regras
| Segmento | Valor | Exemplo |
|---|---|---|
| Prefixo | sempre `processed` | `processed/` |
| Nível 1 | UUID completo da propriedade | `8cc63dfa-42c9-4b84-a950-72077b283435` |
| Arquivo | `{YYYY-MM-DD}_{INDICE}.tif` | `2025-12-29_NDVI.tif` |

- A data é a **data de captura do satélite** (não de processamento).
- O índice é em maiúsculas: `NDVI`, `NDWI`, `EVI`, `NDRE`, `MSI`, `SAVI`.
- O formato é sempre `.tif` (GeoTIFF).

---

## 2. Identificador Semântico

O banco de dados armazena um identificador legível por humanos no campo `identificador` da tabela `artefatos`:

```
{8 chars do propriedadeId}-{YYYYMMDD}-{INDICE}
```

### Exemplos
| Caminho GCS | Identificador |
|---|---|
| `processed/8cc63dfa-.../2025-12-29_NDVI.tif` | `8cc63dfa-20251229-NDVI` |
| `processed/8cc63dfa-.../2026-03-08_NDWI.tif` | `8cc63dfa-20260308-NDWI` |

### Geração automática
Se o campo `identificador` não estiver salvo no banco, a API o gera automaticamente a partir do `caminho` via `src/utils/artefatos.utils.ts`:

```typescript
parseCaminho('processed/8cc63dfa-42c9-.../2025-12-29_NDVI.tif')
// → { propriedadeId: '8cc63dfa-42c9-...', data: '2025-12-29', indice: 'NDVI' }

gerarIdentificador('8cc63dfa-42c9-...', '2025-12-29', 'NDVI')
// → '8cc63dfa-20251229-NDVI'
```

---

## 3. Parse no Frontend

O serviço `web/src/services/artefatos.ts` expõe:

```typescript
parseIdentificador('8cc63dfa-20251229-NDVI')
// → { shortId: '8cc63dfa', data: '2025-12-29', indice: 'NDVI' }

formatArtefatoLabel(artefato)
// → 'NDVI — 29/12/2025'
```

---

## 4. Campo `caminho` — Segurança

O campo `caminho` (path interno do GCS) **não é exposto** nas respostas da API. Apenas a URL assinada temporária é fornecida ao frontend via `GET /api/artefatos/:id/signed-url`.

---

## 5. Fluxo Completo (Core → API → Frontend)

```
[Core Python]
  Processa Sentinel-2 → gera NDVI.tif
  Faz upload para: processed/{propriedadeId}/{YYYY-MM-DD}_{INDICE}.tif
  Notifica API: POST /internal/jobs/:id/complete
    { caminho: 'processed/...', indice: 'NDVI', dataReferencia: '2025-12-29' }

[API Node.js]
  Cria Artefato no banco com:
    caminho = 'processed/.../2025-12-29_NDVI.tif'
    identificador = '8cc63dfa-20251229-NDVI'  (gerado automaticamente)
    indice = 'NDVI'
    dataReferencia = 2025-12-29

[Frontend]
  GET /api/artefatos/propriedade/{id}  → lista artefatos
  Usuário seleciona NDVI do dia 29/12
  GET /api/artefatos/8cc63dfa-20251229-NDVI/signed-url  → URL temporária
  fetch(signedUrl) → parseGeoraster → renderiza no Leaflet
```

---

## 6. Configuração CORS (Necessária)

Para que o browser consiga fazer `fetch(signedUrl)` diretamente no GCS, o bucket precisa de CORS configurado:

```json
// cors.json
[{
  "origin": ["https://seu-dominio.com", "http://localhost:3000"],
  "method": ["GET"],
  "responseHeader": ["Content-Type", "Content-Range"],
  "maxAgeSeconds": 3600
}]
```

```bash
gsutil cors set cors.json gs://atmos-agro-data-lake-dev
gsutil cors get gs://atmos-agro-data-lake-dev  # verificar
```
