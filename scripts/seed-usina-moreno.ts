import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Iniciando Seed Corrigido: Usina Moreno ---');

  // 1. Buscar ou criar um cliente padrão
  let cliente = await prisma.cliente.findFirst();
  if (!cliente) {
    cliente = await prisma.cliente.create({
      data: {
        nome: 'Atmos Agro Demo',
        documento: '12345678000100',
        tipoDocumento: 'CNPJ',
        status: 'ativo'
      }
    });
  }

  // 2. Criar ou Atualizar a Propriedade Usina Moreno (Busca direta pelo ID)
  const propriedade = await prisma.propriedade.upsert({
    where: { id: '8cc63dfa-42c9-4b84-a950-72077b283435' },
    update: { 
      nome: 'Usina Moreno',
      clienteId: cliente.id,
      codigoInterno: 'USM-001'
    },
    create: {
      id: '8cc63dfa-42c9-4b84-a950-72077b283435',
      nome: 'Usina Moreno',
      codigoInterno: 'USM-001',
      clienteId: cliente.id,
      culturaPrincipal: 'Cana-de-açúcar',
      safraAtual: '2025/2026'
    }
  });

  console.log(`Propriedade: ${propriedade.nome} (ID: ${propriedade.id})`);

  // 3. Criar um Talhão para teste
  const talhao = await prisma.talhao.upsert({
    where: {
      propriedadeId_codigo: {
        propriedadeId: propriedade.id,
        codigo: 'T01'
      }
    },
    update: {},
    create: {
      propriedadeId: propriedade.id,
      codigo: 'T01',
      nome: 'Talhão de Teste 01',
      areaHectares: 45.5,
      cultura: 'Cana-de-açúcar'
    }
  });

  // 4. Criar Artefatos com as Novas Regras
  const dataRef = new Date('2026-03-08');

  // Limpa artefatos antigos dessa propriedade para evitar duplicidade de caminho
  await prisma.artefato.deleteMany({
    where: { 
      OR: [
        { propriedadeId: propriedade.id },
        { talhaoId: talhao.id }
      ]
    }
  });

  const artefatos = [
    {
      tipo: 'geotiff' as const,
      indice: 'NDVI_TOTAL',
      identificador: '8cc63dfa-20260308-NDVI_TOTAL',
      caminho: 'sentinel2/usina_moreno_ndvi_20260308.tif',
      propriedadeId: propriedade.id,
      dataReferencia: dataRef,
      metadata: { sensor: 'Sentinel-2', escala: 'fazenda_completa' }
    },
    {
      tipo: 'geotiff' as const,
      indice: 'NDWI_TOTAL',
      identificador: '8cc63dfa-20260308-NDWI_TOTAL',
      caminho: 'sentinel2/usina_moreno_ndwi_20260308.tif',
      propriedadeId: propriedade.id,
      dataReferencia: dataRef,
      metadata: { sensor: 'Sentinel-2', escala: 'fazenda_completa' }
    },
    {
      tipo: 'geotiff' as const,
      indice: 'NDVI',
      identificador: '8cc63dfa-20260308-NDVI_T01',
      talhaoId: talhao.id,
      caminho: 'sentinel2/t01_ndvi_20260308.tif',
      dataReferencia: dataRef,
      metadata: { sensor: 'Sentinel-2' }
    }
  ];

  for (const art of artefatos) {
    await prisma.artefato.create({ data: art });
  }

  console.log('--- Seed concluído com sucesso! ---');
}

main()
  .catch((e) => {
    console.error('Erro no Seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
