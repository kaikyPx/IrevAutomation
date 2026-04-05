import { processIRevSync } from './src/lib/irev.ts';

async function testPush() {
  console.log('--- TESTE DE PUSH ESPECÍFICO IREV ---');
  
  const testData = {
    affiliateId: "4",
    offerId: "48",
    linkId: "4353",
    house: "TEST_HOUSE",
    source: "MANUAL_TEST",
    regs: 3,
    ftds: 2,
    cpa: 0,
    deps: 100,
    ngr: 400
  };

  console.log('Enviando dados:', testData);
  
  try {
    await processIRevSync(testData);
    console.log('\n--- FIM DO TESTE ---');
  } catch (error) {
    console.error('Erro no teste:', error);
  }
}

testPush();
