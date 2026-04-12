# 📄 Atmos API - Gestão de Artefatos

> **Atualizado em: Abril/2026**
> 
> O campo `caminho` (path interno do GCS) **não é exposto** nas respostas da API por segurança.  
> Para carregar um GeoTIFF no frontend, use `GET /:id/signed-url` em vez do proxy stream.

---

## Convenção de Armazenamento (GCS)

Os arquivos são armazenados no bucket com o padrão:

```
processed/{propriedadeId}/{YYYY-MM-DD}_{INDICE}.tif
```

**Exemplo:**
```
processed/8cc63dfa-42c9-4b84-a950-72077b283435/2025-12-29_NDVI.tif
```

---

## Identificador Semântico

Todo artefato possui um `identificador` no formato:

```
{8 chars do propriedadeId}-{YYYYMMDD}-{INDICE}
```

**Exemplo:** `8cc63dfa-20251229-NDVI`

O identificador é gerado automaticamente a partir do caminho GCS se não for salvo explicitamente.  
Todos os endpoints de artefatos aceitam tanto o **UUID** quanto o **identificador semântico**.

---

## Endpoints disponíveis

| Método | Endpoint | Descrição |
|---|---|---|
| `GET` | `/api/artefatos` | Lista todos os artefatos do cliente |
| `GET` | `/api/artefatos/propriedade/:propriedadeId` | Lista artefatos de uma propriedade |
| `GET` | `/api/artefatos/:id` | Metadados de um artefato (UUID ou identificador) |
| `GET` | `/api/artefatos/:id/signed-url` | **Signed URL temporária (15 min) — uso preferencial no mapa** |
| `GET` | `/api/artefatos/:id/download` | Download via proxy stream (fallback) |

---

## 1. Listar todos do Cliente

### `GET /api/artefatos`

**Resposta (200 OK):**

```json
[
  {
    "id": "e9e0d9ef-ed04-429c-ae75-c1a3182ac6d2",
    "identificador": "8cc63dfa-20251229-NDVI",
    "tipo": "geotiff",
    "indice": "NDVI",
    "dataReferencia": "2025-12-29T00:00:00.000Z",
    "geradoEm": "2025-12-29T10:00:00.000Z",
    "url": "/api/artefatos/8cc63dfa-20251229-NDVI/download",
    "metadata": { "sensor": "Sentinel-2" },
    "talhao": null,
    "propriedade": { "nome": "Usina Moreno" }
  }
]
```

---

## 2. Listar por Propriedade

### `GET /api/artefatos/propriedade/:propriedadeId`

Inclui artefatos da propriedade e de todos os seus talhões.

**Resposta (200 OK):** mesmo formato acima, podendo ter `talhao` preenchido.

---

## 3. Buscar Individual

### `GET /api/artefatos/:id`

Aceita UUID ou identificador semântico.

**Resposta (200 OK):**

```json
{
  "id": "e9e0d9ef-ed04-429c-ae75-c1a3182ac6d2",
  "identificador": "8cc63dfa-20251229-NDVI",
  "tipo": "geotiff",
  "indice": "NDVI",
  "dataReferencia": "2025-12-29T00:00:00.000Z",
  "url": "/api/artefatos/8cc63dfa-20251229-NDVI/download",
  "metadata": { "sensor": "Sentinel-2" },
  "talhao": null,
  "propriedade": { "nome": "Usina Moreno" }
}
```

---

## 4. Signed URL (Preferencial para o mapa)

### `GET /api/artefatos/:id/signed-url`

Ver documentação completa em [`AtmosApi_Artefato_SignedUrl.md`](./AtmosApi_Artefato_SignedUrl.md).

**Resposta (200 OK):**

```json
{
  "signedUrl": "https://storage.googleapis.com/atmos-agro-data-lake-dev/processed/...",
  "expiresAt": "2025-12-29T14:15:00.000Z"
}
```

---

## 5. Download via Proxy (Fallback)

### `GET /api/artefatos/:id/download`

Retorna os bytes do arquivo via stream. Útil como fallback quando CORS não está configurado no GCS.

- **Content-Type:** `image/tiff`
- **Content-Disposition:** `attachment; filename="..."`
