# Endpoint: GET /api/artefatos/:id/signed-url

## Descrição

Gera e retorna uma **URL assinada temporária (Signed URL)** para o arquivo GeoTIFF armazenado no Google Cloud Storage.

Esta é a forma **preferencial** de carregar imagens de satélite no frontend. Em vez de o arquivo trafegar pela API (proxy stream), o browser faz o download diretamente do GCS usando a URL assinada, reduzindo latência e carga na API.

A URL expira em **15 minutos**. O frontend deve solicitar uma nova URL ao carregar cada imagem.

---

## Método

`GET`

---

## Autenticação

Requer token JWT válido (`Authorization: Bearer <token>`). O `clienteId` do usuário é validado contra o artefato — acesso negado a artefatos de outros clientes.

---

## Parâmetros de Requisição

### Path Params

| Param | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | string | Sim | UUID ou Identificador Semântico do artefato |

**Exemplos:**
- Por UUID: `GET /api/artefatos/e9e0d9ef-ed04-429c-ae75-c1a3182ac6d2/signed-url`
- Por Identificador: `GET /api/artefatos/8cc63dfa-20251229-NDVI/signed-url`

---

## Resposta de Sucesso (200 OK)

```json
{
  "signedUrl": "https://storage.googleapis.com/atmos-agro-data-lake-dev/processed/8cc63dfa-42c9-4b84-a950-72077b283435/2025-12-29_NDVI.tif?X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Credential=...&X-Goog-Date=...&X-Goog-Expires=900&X-Goog-SignedHeaders=host&X-Goog-Signature=...",
  "expiresAt": "2025-12-29T14:15:00.000Z"
}
```

| Campo | Tipo | Descrição |
|---|---|---|
| `signedUrl` | string | URL direta para o GCS, válida por 15 minutos |
| `expiresAt` | string (ISO 8601) | Timestamp de expiração da URL |

---

## Respostas de Erro

| Status | Descrição |
|---|---|
| `401 Unauthorized` | Token ausente ou inválido |
| `403 Forbidden` | Artefato pertence a outro cliente |
| `404 Not Found` | Artefato não encontrado |
| `500 Internal Server Error` | Falha ao gerar a URL no GCS (credenciais ausentes ou arquivo inexistente) |

---

## Uso no Frontend

```typescript
// services/artefatos.ts
const { signedUrl } = await getArtefatoSignedUrl(artefato.id);

// Carrega o GeoTIFF diretamente do GCS
const response = await fetch(signedUrl);
const arrayBuffer = await response.arrayBuffer();
const georaster = await parseGeoraster(arrayBuffer);
```

> **Nota CORS:** O bucket GCS precisa ter CORS configurado para o domínio do frontend.
> Configuração mínima:
> ```json
> [{ "origin": ["https://seu-dominio.com"], "method": ["GET"], "responseHeader": ["Content-Type"], "maxAgeSeconds": 3600 }]
> ```

---

## Relação com outros endpoints

| Endpoint | Quando usar |
|---|---|
| `GET /:id/signed-url` | **Preferencial** — carregar GeoTIFF no mapa (frontend) |
| `GET /:id/download` | Download direto via proxy da API (fallback ou uso administrativo) |
