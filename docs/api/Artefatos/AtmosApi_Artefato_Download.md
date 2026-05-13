# Endpoint: GET /api/artefatos/:id/download

## Descrição

Entrega os bytes do arquivo GeoTIFF via **proxy stream** diretamente na resposta HTTP.

> **Atenção:** Este é o endpoint de **fallback**. Para carregar imagens no mapa interativo, use preferencialmente `GET /:id/signed-url`, que transfere o arquivo diretamente do GCS para o browser sem passar pela API.

Use este endpoint quando:
- CORS ainda não está configurado no bucket GCS
- O arquivo precisa ser baixado como download direto (`Content-Disposition: attachment`)
- Uso administrativo ou testes

---

## Método

`GET`

---

## Parâmetros de Requisição

### Path Params

| Param | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | string | Sim | UUID ou Identificador Semântico do artefato |

**Exemplos:**
- Por UUID: `GET /api/artefatos/e9e0d9ef-ed04-429c-ae75-c1a3182ac6d2/download`
- Por Identificador: `GET /api/artefatos/8cc63dfa-20251229-NDVI/download`

---

## Resposta de Sucesso (200 OK)

- **Content-Type:** `image/tiff`
- **Content-Disposition:** `attachment; filename="2025-12-29_NDVI.tif"`
- **Corpo:** Stream binário do arquivo GeoTIFF

---

## Respostas de Erro

| Status | Descrição |
|---|---|
| `401 Unauthorized` | Token ausente ou inválido |
| `403 Forbidden` | Artefato pertence a outro cliente |
| `404 Not Found` | Artefato não encontrado |
| `500 Internal Server Error` | Falha na leitura do arquivo no GCS |

---

## Comparação: Download vs Signed URL

| Critério | `/:id/download` | `/:id/signed-url` |
|---|---|---|
| Transferência | Passa pela API (proxy) | Direto GCS → browser |
| Latência | Maior | Menor |
| Carga na API | Alta (streama o arquivo inteiro) | Mínima (só gera a URL) |
| CORS necessário | Não | Sim (no bucket GCS) |
| Uso recomendado | Fallback / download admin | **Mapa interativo (preferencial)** |
