# Endpoint: /api/artefatos/:id (GET)

## Descrição:
Retorna os metadados completos de um único artefato. Este endpoint é flexível e aceita tanto o **UUID técnico** quanto o **Identificador Semântico**.

## Método:
`GET`

## Parâmetros de Requisição:
### Path Params:
- `id` (string, UUID ou Identificador, Obrigatório): 
    - Exemplo UUID: `e9e0d9ef-ed04-429c-ae75-c1a3182ac6d2`
    - Exemplo Identificador: `8cc63dfa-20260308-RGB_TOTAL`

## Resposta de Sucesso (200 OK):
### Exemplo com Identificador Semântico:
**Requisição:**
`GET /api/artefatos/8cc63dfa-20260308-RGB_TOTAL`

**Resposta:**
`Status: 200 OK`
```json
{
  "id": "e9e0d9ef-ed04-429c-ae75-c1a3182ac6d2",
  "identificador": "8cc63dfa-20260308-RGB_TOTAL",
  "tipo": "geotiff",
  "indice": "RGB_TOTAL",
  "dataReferencia": "2026-03-08T00:00:00.000Z",
  "url": "/api/artefatos/8cc63dfa-20260308-RGB_TOTAL/download",
  "metadata": {
    "sensor": "Sentinel-2",
    "escala": "fazenda_completa"
  }
}
```

---

## Respostas de Erro:

### 404 Not Found:
Artefato não encontrado (ID ou Identificador inexistente).

### 403 Forbidden:
Acesso negado (o artefato pertence a outro cliente).
