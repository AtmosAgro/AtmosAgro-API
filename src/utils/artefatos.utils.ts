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
 * Faz o parse do caminho GCS e extrai propriedadeId, data e índice.
 * Retorna null se o caminho não seguir a convenção esperada.
 */
export function parseCaminho(caminho: string): CaminhoParseado | null {
  // esperado: processed/{uuid}/{YYYY-MM-DD}_{INDICE}.tif
  const parts = caminho.split('/');
  if (parts.length < 3 || parts[0] !== 'processed') return null;

  const propriedadeId = parts[1];
  const filename = parts[parts.length - 1]; // "2025-12-29_NDVI.tif"
  const withoutExt = filename.replace(/\.tif$/i, ''); // "2025-12-29_NDVI"

  const underscoreIdx = withoutExt.indexOf('_');
  if (underscoreIdx === -1) return null;

  const data = withoutExt.slice(0, underscoreIdx);   // "2025-12-29"
  const indice = withoutExt.slice(underscoreIdx + 1); // "NDVI"

  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) return null;

  return { propriedadeId, data, indice };
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
