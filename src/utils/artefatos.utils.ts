/**
 * Utilitários para parsing e geração de identificadores de Artefatos.
 *
 * Convenção do caminho GCS:
 *   processed/{propriedadeId}/{YYYY-MM-DD}_{INDICE}.tif
 * Exemplo:
 *   processed/8cc63dfa-42c9-4b84-a950-72077b283435/2025-12-29_NDVI.tif
 *
 * Identificador semântico gerado:
 *   {8 chars do propriedadeId}-{YYYYMMDD}-{INDICE}
 * Exemplo:
 *   8cc63dfa-20251229-NDVI
 */

export interface CaminhoParseado {
  propriedadeId: string;
  data: string;   // YYYY-MM-DD
  indice: string; // ex: NDVI, NDWI
}

/**
 * Faz o parse do caminho do storage e extrai propriedadeId, data e índice.
 * Aceita dois formatos:
 *   - Novo (AT-21): processed/{clienteId}/{propriedadeId}/{YYYY-MM-DD}/{indice}.tif
 *   - Legacy:      processed/{propriedadeId}/{YYYY-MM-DD}_{INDICE}.tif
 * Retorna null se o caminho não seguir nenhuma das convenções.
 */
export function parseCaminho(caminho: string): CaminhoParseado | null {
  // Aceita prefixo gs://bucket/ opcional
  const stripped = caminho.startsWith('gs://')
    ? caminho.slice(5).split('/').slice(1).join('/')
    : caminho;

  const parts = stripped.split('/');
  if (parts[0] !== 'processed') return null;

  // Formato novo: processed/{clienteId}/{propriedadeId}/{YYYY-MM-DD}/{indice}.tif (5 partes)
  if (parts.length === 5) {
    const propriedadeId = parts[2];
    const data = parts[3];
    const indice = parts[4].replace(/\.tif{1,2}$/i, '');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) return null;
    return { propriedadeId, data, indice };
  }

  // Formato legacy: processed/{propriedadeId}/{YYYY-MM-DD}_{INDICE}.tif (3 partes)
  if (parts.length === 3) {
    const propriedadeId = parts[1];
    const filename = parts[2];
    const withoutExt = filename.replace(/\.tif{1,2}$/i, '');
    const underscoreIdx = withoutExt.indexOf('_');
    if (underscoreIdx === -1) return null;
    const data = withoutExt.slice(0, underscoreIdx);
    const indice = withoutExt.slice(underscoreIdx + 1);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) return null;
    return { propriedadeId, data, indice };
  }

  return null;
}

/**
 * Gera o identificador semântico a partir dos componentes.
 * Formato: {8 chars do uuid}-{YYYYMMDD}-{INDICE}
 */
export function gerarIdentificador(
  propriedadeId: string,
  data: string,
  indice: string
): string {
  const shortId = propriedadeId.slice(0, 8);
  const dataFormatted = data.replace(/-/g, ''); // "20251229"
  return `${shortId}-${dataFormatted}-${indice}`;
}

/**
 * Atalho: gera o identificador semântico diretamente do caminho GCS.
 * Retorna null se o caminho não puder ser parseado.
 */
export function identificadorDoCaminho(caminho: string): string | null {
  const parsed = parseCaminho(caminho);
  if (!parsed) return null;
  return gerarIdentificador(parsed.propriedadeId, parsed.data, parsed.indice);
}
