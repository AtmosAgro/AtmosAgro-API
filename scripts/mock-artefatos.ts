import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const PROPRIEDADE_ID = '8cc63dfa-42c9-4b84-a950-72077b283435';

async function main() {
  console.log('--- Iniciando Mock de Artefatos Diretos para Propriedade 8cc63dfa ---');

  // Artefatos com caminho no padrão: processed/{propriedadeId}/{YYYY-MM-DD}_{INDICE}.tif
  const artefatos = [
    {
      tipo: 'geotiff' as const,
      indice: 'NDVI',
      caminho: `processed/${PROPRIEDADE_ID}/2025-12-29_NDVI.tif`,
      identificador: `${PROPRIEDADE_ID.slice(0, 8)}-20251229-NDVI`,
      propriedadeId: PROPRIEDADE_ID,
      dataReferencia: new Date('2025-12-29'),
      metadata: { sensor: 'Sentinel-2', escala: 'fazenda_completa' }
    },
    {
      tipo: 'geotiff' as const,
      indice: 'NDWI',
      caminho: `processed/${PROPRIEDADE_ID}/2025-12-29_NDWI.tif`,
      identificador: `${PROPRIEDADE_ID.slice(0, 8)}-20251229-NDWI`,
      propriedadeId: PROPRIEDADE_ID,
      dataReferencia: new Date('2025-12-29'),
      metadata: { sensor: 'Sentinel-2', escala: 'fazenda_completa' }
    },
    {
      tipo: 'geotiff' as const,
      indice: 'NDVI',
      caminho: `processed/${PROPRIEDADE_ID}/2026-03-08_NDVI.tif`,
      identificador: `${PROPRIEDADE_ID.slice(0, 8)}-20260308-NDVI`,
      propriedadeId: PROPRIEDADE_ID,
      dataReferencia: new Date('2026-03-08'),
      metadata: { sensor: 'Sentinel-2', escala: 'fazenda_completa' }
    },
  ];

  for (const art of artefatos) {
    await prisma.artefato.create({
      data: art
    });
    console.log(`Artefato ${art.indice} (Fazenda Toda) criado.`);
  }

  console.log('--- Mock concluído com sucesso! ---');
}

main()
  .catch((e) => {
    console.error('Erro ao criar mocks:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
