# 🏗️ Arquitetura: Padrão de Respostas (DTOs)

## 1. Visão Geral
Toda resposta da API CanaVision deve passar por um **DTO (Data Transfer Object)**. O Prisma Model (banco) nunca deve chegar puro ao Frontend.

O DTO garante um contrato estável, remove campos técnicos e protege informações sensíveis.

---

## 2. Tipos de DTOs e Casos de Uso

### 2.1. DTO de Detalhe (Complete)
- Retorna o objeto completo filtrando apenas segredos (ex: `passwordHash`, `tfaSecret`).
- **Exemplo (Usuário):**
```json
{
  "id": "uuid...",
  "nome": "Lucas",
  "email": "lucas@atmos.com",
  "ultimoLogin": "2026-03-12T...",
  "role": "ADMIN"
  // passwordHash é removido
}
```

### 2.2. DTO de Listagem (Summary)
- Retorna apenas o essencial para reduzir o peso do JSON.
- **Exemplo (Propriedade):** Retorna o nome, área e ID, mas esconde o GeoJSON pesado na listagem.

### 2.3. DTO de Recurso Protegido
- Remove caminhos de infraestrutura.
- **Exemplo (Artefatos):** Substitui o `caminho` interno do Bucket por uma `url` de acesso amigável.

---

## 3. Padrões Técnicos Globais

### 3.1. Datas (ISO 8601)
- Todas as datas devem sair em formato ISO UTC (Ex: `2026-03-12T10:00:00Z`).

### 3.2. Nomenclatura (camelCase)
- O banco usa `snake_case` mapeado no Prisma para `camelCase`. 
- O DTO garante que o Frontend nunca receba `created_at` e sim `createdAt`.

### 3.3. Objetos Aninhados
- Devem ser limitados para evitar circularidade. De preferência, retorne IDs e deixe o Frontend buscar o detalhe em outro endpoint se necessário.

---

## 4. Diferença Banco vs API (Exemplo Global)

**Banco (Tabela Clientes):**
- `id`: UUID
- `nome`: String
- `documento`: String (CPF/CNPJ)
- `config`: JSON (Configurações internas técnicas)
- `created_at`: DateTime

**API (ClienteResponseDTO):**
- `id`: UUID
- `nome`: String
- `documento`: String (Formatado se necessário)
- `createdAt`: ISO Date
- **Omitido:** `config` (Dados técnicos de infra).
