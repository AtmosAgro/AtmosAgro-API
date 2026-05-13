# 📋 Planejamento: Identificadores Semânticos e Foco em Propriedade (Artefatos)

## 1. Objetivo
Transformar a forma como os artefatos são identificados e consumidos, saindo de uma visão estritamente técnica (UUID) para uma visão semântica baseada na **Propriedade**, **Data da Imagem** e **Índice**, facilitando o parse e a organização no Frontend.

## 2. Mudanças no Schema (Banco de Dados)

Atualmente, o `Artefato` possui `geradoEm` (data de criação no sistema). Precisamos de uma data que represente o momento da captura do satélite.

- **Campo `data_referencia` (DateTime/Date):** Armazenará a data real da imagem (ex: 2026-03-08).
- **Campo `identificador_semantico` (String, Opcional/Calculado):** Um campo único ou uma lógica de geração que combine `propriedadeId + data_referencia + indice`.

## 3. Lógica de Identificação (O "Parse")

O identificador seguirá o padrão:
`{ID_CURTO_PROPRIEDADE}-{DATA_ISO}-{INDICE}`

**Exemplo:**
- Propriedade: `8cc63dfa` (Usina Moreno)
- Data: `2026-03-08`
- Índice: `NDVI_TOTAL`
- **Identificador:** `8cc63dfa-20260308-NDVI_TOTAL`

## 4. Priorização de Propriedade vs Talhão

Embora os artefatos possam ser gerados para um talhão específico, a API passará a expor o `propriedadeId` como o agrupador principal. 
- Se o artefato for de um talhão, ele herdará o `propriedadeId` do pai na resposta.
- A listagem por propriedade passará a ser o endpoint central de consumo do mapa.

## 5. Plano de Ação

1.  **Migração:** Adicionar `data_referencia` à tabela `Artefato`.
2.  **Service:** Implementar função `gerarIdentificadorSemantico(artefato)`.
3.  **Controller/DTO:** Atualizar a resposta JSON para incluir o novo identificador e a data de referência formatada.
4.  **Mock:** Atualizar o script de mock para popular esses novos campos.

---
**Status:** ✅ Implementado (Abril/2026)

**O que foi feito:**
- `src/utils/artefatos.utils.ts` — `parseCaminho()` e `gerarIdentificador()` implementados
- `ArtefatosService.formatResponse()` gera identificador automaticamente do caminho GCS
- Campo `caminho` removido do response (segurança)
- `dataReferencia` e `indice` extraídos do caminho como fallback se não estiverem no banco
- Script `scripts/mock-artefatos.ts` atualizado com caminhos no padrão correto
