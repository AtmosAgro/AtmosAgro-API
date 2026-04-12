# Endpoint: GET /api/artefatos/propriedade/:propriedadeId

## Descrição

Lista todos os artefatos GeoTIFF vinculados a uma propriedade específica.  
Inclui tanto artefatos da **propriedade inteira** quanto artefatos de **talhões individuais** pertencentes a ela.

> O campo `caminho` (path interno do GCS) **não é retornado** por segurança.  
> Para carregar um arquivo no mapa, use `GET /api/artefatos/:id/signed-url`.

---

## Método

`GET`

---

## Parâmetros de Requisição

### Path Params

| Param | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `propriedadeId` | string (UUID) | Sim | ID da propriedade |

---

## Resposta de Sucesso (200 OK)

```json
[
  {
    "id": "e9e0d9ef-ed04-429c-ae75-c1a3182ac6d2",
    "identificador": "8cc63dfa-20251229-NDVI",
    "jobId": null,
    "talhaoId": null,
    "propriedadeId": "8cc63dfa-42c9-4b84-a950-72077b283435",
    "tipo": "geotiff",
    "formato": null,
    "indice": "NDVI",
    "dataReferencia": "2025-12-29T00:00:00.000Z",
    "geradoEm": "2025-12-29T10:00:00.000Z",
    "url": "/api/artefatos/8cc63dfa-20251229-NDVI/download",
    "metadata": {
      "sensor": "Sentinel-2",
      "escala": "fazenda_completa"
    },
    "talhao": null,
    "propriedade": {
      "nome": "Usina Moreno"
    }
  },
  {
    "id": "a820340f-80f5-40a5-a99e-d68c50f235c8",
    "identificador": "8cc63dfa-20251229-NDWI",
    "jobId": null,
    "talhaoId": "81c8e3d3-0eab-4412-b248-8d1cc2f21ba6",
    "propriedadeId": null,
    "tipo": "geotiff",
    "formato": null,
    "indice": "NDWI",
    "dataReferencia": "2025-12-29T00:00:00.000Z",
    "geradoEm": "2025-12-29T10:00:00.000Z",
    "url": "/api/artefatos/8cc63dfa-20251229-NDWI/download",
    "metadata": {
      "sensor": "Sentinel-2"
    },
    "talhao": {
      "nome": "Talhão 01",
      "codigo": "T01"
    },
    "propriedade": {
      "nome": "Usina Moreno"
    }
  }
]
```

---

## Fluxo típico no Frontend

```typescript
// 1. Buscar artefatos disponíveis para a propriedade
const artefatos = await listArtefatosByPropriedade(propriedadeId);

// 2. Usuário seleciona um artefato para visualizar no mapa
const { signedUrl } = await getArtefatoSignedUrl(artefato.id);

// 3. Carregar GeoTIFF diretamente do GCS
const response = await fetch(signedUrl);
const arrayBuffer = await response.arrayBuffer();
const georaster = await parseGeoraster(arrayBuffer);
```

---

## Respostas de Erro

| Status | Descrição |
|---|---|
| `400 Bad Request` | `propriedadeId` com formato inválido |
| `401 Unauthorized` | Usuário não autenticado ou sem cliente associado |
| `404 Not Found` | Propriedade não encontrada ou não pertence ao cliente |
