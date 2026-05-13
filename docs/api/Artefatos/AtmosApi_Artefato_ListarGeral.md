# Endpoint: /api/artefatos (GET)

## Descrição:
Lista todos os artefatos vinculados ao cliente autenticado, abrangendo todas as suas propriedades e talhões. Útil para visões globais, dashboards iniciais ou auditoria de arquivos gerados.

> **Nota:** O endpoint utiliza o **Identificador Semântico** (`propriedade-data-indice`) para facilitar o agrupamento no Frontend.

## Método:
`GET`

## Parâmetros de Requisição:
### Path Params:
Nenhum.

### Query Params:
*(Opcional)* Filtros por tipo (ex: `?tipo=geotiff`) podem ser adicionados futuramente.

### Body:
Nenhum.

## Resposta de Sucesso (200 OK):
### Exemplo de Sucesso:
**Requisição:**
`GET /api/artefatos`

**Resposta:**
`Status: 200 OK`
```json
[
  {
    "id": "e9e0d9ef-ed04-429c-ae75-c1a3182ac6d2",
    "identificador": "8cc63dfa-20260308-RGB_TOTAL",
    "tipo": "geotiff",
    "indice": "RGB_TOTAL",
    "dataReferencia": "2026-03-08T00:00:00.000Z",
    "geradoEm": "2026-03-08T03:05:33.228Z",
    "url": "/api/artefatos/e9e0d9ef-ed04-429c-ae75-c1a3182ac6d2/download",
    "talhao": null,
    "propriedade": {
      "nome": "Usina Moreno"
    }
  },
  {
    "id": "a820340f-80f5-40a5-a99e-d68c50f235c8",
    "identificador": "8cc63dfa-20260308-RGB_T01",
    "tipo": "geotiff",
    "indice": "RGB",
    "dataReferencia": "2026-03-08T00:00:00.000Z",
    "geradoEm": "2026-03-08T01:32:24.203Z",
    "url": "/api/artefatos/a820340f-80f5-40a5-a99e-d68c50f235c8/download",
    "talhao": {
      "nome": "Talhão 01",
      "propriedade": {
        "nome": "Usina Moreno"
      }
    }
  }
]
```

---

## Respostas de Erro:

### 401 Unauthorized:
Usuário não autenticado ou sessão expirada.

### 500 Internal Server Error:
Erro ao consultar o banco de dados.
