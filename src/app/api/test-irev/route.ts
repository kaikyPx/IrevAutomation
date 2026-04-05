import { NextResponse } from 'next/server';
import { processIRevSync } from '@/lib/irev';

export async function GET() {
  console.log('--- TESTE DE PUSH IREV VIA API ---');
  
  const testData = {
    affiliateId: "4",
    offerId: "48",
    linkId: "4353",
    house: "TEST_HOUSE",
    source: "API_TEST",
    regs: 3,
    ftds: 2,
    cpa: 0,
    deps: 100,
    ngr: 400
  };

  try {
    const success = await processIRevSync(testData);
    return NextResponse.json({ 
      message: 'Teste executado', 
      success,
      data_sent: testData 
    });
  } catch (error) {
    console.error('Erro no teste API:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
