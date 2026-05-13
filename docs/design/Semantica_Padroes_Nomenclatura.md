# 🏗️ Arquitetura: Semântica e Padrões de Nomenclatura

Este documento define a linguagem onipresente e os padrões de escrita do CanaVision. O objetivo é reduzir a carga cognitiva: ao ler um nome, qualquer desenvolvedor deve saber exatamente o que aquilo faz e onde se encaixa.

---

## 1. Idioma e Escrita
- **Código (Variáveis, Funções, Classes):** Inglês (Padrão técnico universal).
- **Documentação e Commits:** Português (Para clareza estratégica entre os fundadores).
- **Termos de Domínio:** Devem ser consistentes. Se usamos `Talhão` na doc, no código será `Talhao` (sem acento) e nunca `Plot` ou `Field`.

## 2. Nomenclatura de Código (TypeScript/Node)

### 2.1. Variáveis e Propriedades (camelCase)
- Devem ser descritivas.
- `const propId = ...` (Não use `const p = ...`).
- **Booleanos:** Devem começar com is/has/should. Ex: `isActive`, `hasPermission`.

### 2.2. Funções e Métodos (camelCase + Verbo)
- Devem expressar ação.
- `getById()`, `listByPropriedade()`, `calculateNdvi()`.

### 2.3. Classes e Types (PascalCase)
- `ArtefatosService`, `PropriedadeRepository`, `UserDTO`.

---

## 3. Estrutura de Pastas (FileSystem)
Usamos **kebab-case** (letras minúsculas separadas por hífen) para pastas e arquivos físicos para evitar problemas entre Windows/Linux.

- **Caminho:** `src/api/controllers/artefatos/artefatos.controller.ts`
- **Caminho:** `docs/design/regras-negocio.md`

---

## 4. Semântica de Domínio (Negócio)
Para manter o alinhamento com o setor agrícola:
- **Propriedade:** O conjunto total (Fazenda/Usina).
- **Talhão:** A subdivisão mínima de plantio.
- **Artefato:** Qualquer arquivo gerado pelo pipeline (TIFF, JSON, CSV).
- **Job:** Um processo em execução no pipeline.

---

## 5. Nomenclatura de Artefatos (Slugs)
Regra para identificadores únicos amigáveis:
`{ID_CURTO_PROPRIEDADE}-{DATA_YYYYMMDD}-{INDICE}_{SUFIXO_OPCIONAL}`

- **ID_CURTO:** Primeiros 8 caracteres do UUID da propriedade.
- **DATA:** Data da captura do satélite.
- **INDICE:** NDVI, NDWI, RGB, etc.
- **SUFIXO:** Código do talhão (se houver).

---

## 6. Padrões de Documentação (Markdown)
- **Títulos:** Usar Emojis para identificação visual rápida (ex: 🏗️ Arquitetura, 🧠 Regras, 📄 API).
- **Destaques:** Usar blocos de citação (`>`) para notas de implementação ou avisos importantes.
- **Exemplos:** Sempre prover exemplos de JSON de entrada e saída.

---

## 7. Mensagens de Commit (Conventional Commits)
Seguir o padrão: `tipo(escopo): descrição curta em português`. 
Após o título, utilize o corpo do commit para detalhar as mudanças técnicas (Pressione `Ctrl + Enter` para nova linha).

### 7.1. Exemplos de Tipos:
- `feat`: Nova funcionalidade.
- `fix`: Correção de bug.
- `docs`: Documentação.
- `refactor`: Mudança no código que não altera comportamento.

### 7.2. Exemplo de Commit Completo (O que fazer):
**Título:**
`feat(api): implementar estrutura semântica e suporte a propriedades para artefatos`

**Corpo (Descrição Técnica):**
- Atualizado schema Prisma para permitir vínculo direto de artefatos com propriedades (campo `propriedadeId`).
- Implementado `ArtefatosRepository` com filtros de multitenancy (isolamento por `clienteId`).
- Criado `ArtefatosService` e `ArtefatosController` com suporte a listagem geral, por propriedade e download via proxy.
- Adicionada documentação técnica no `.md` e referência no Confluence.
- Dados populados via script de Seed para testes iniciais (Mocks).
