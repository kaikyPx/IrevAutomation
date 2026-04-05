import { NextResponse } from 'next/server';
import dns from 'node:dns';
import { identifyAffiliate } from '@/lib/mapping';
import { getSetting } from '@/lib/settings';

// Forçar IPv4 para consistência
dns.setDefaultResultOrder('ipv4first');

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dateFrom = searchParams.get('date_from');
  const dateTo = searchParams.get('date_to');

  const token = getSetting('NOVIBET_TOKEN');
  const domain = getSetting('NOVIBET_DOMAIN') || 'https://partner.novibet.com';

  if (!token) {
    console.warn('[Novibet] Missing configuration token');
    return NextResponse.json({ error: 'Faltando configuração do Token Novibet' }, { status: 500 });
  }

  const url = `${domain}/api/reporting/affiliate?start_date=${dateFrom}&end_date=${dateTo}&currency=EUR&requesting_account_type=affiliate&grouping=affiliate&show_by_site=1`;
  
  // Timeout de 10 segundos para parar de esperar a Novibet
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    console.log(`[Novibet] Fetching: ${url}`);
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      },
      signal: controller.signal,
      next: { revalidate: 3600 }
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const text = await response.text();
      console.error(`[Novibet] API Error ${response.status}: ${text.slice(0, 200)}`);
      return NextResponse.json({ 
        error: `Novibet API Error: ${response.status} - ${response.statusText}` 
      }, { status: response.status });
    }

    const json = await response.json().catch(() => null);
    if (!json) {
       console.error('[Novibet] Invalid JSON received from Novibet');
       return NextResponse.json({ error: 'Novibet enviou uma resposta inválida (não JSON)' }, { status: 502 });
    }

    const records = json.results?.data || [];
    console.log(`[Novibet] Received ${records.length} records`);

    // Agrupar por Username (Vendedor) e extrair CPA
    const sellerAgg = records.reduce((acc: any, curr: any) => {
      const seller = curr.affiliate_profile_username || 'nobrebet';
      const affiliateInfo = identifyAffiliate(seller, 'Novibet');
      
      if (!acc[seller]) {
        acc[seller] = {
          brand: curr.vendor_name || 'Novibet',
          source: seller,
          affiliateName: affiliateInfo?.affiliateName || 'Não Mapeado',
          affiliateId: affiliateInfo?.affiliateId || null,
          irevConfig: affiliateInfo?.mapping || null,
          registrations: 0, 
          ftds: 0, 
          cpa: 0, 
          deposits: 0, 
          ngr: 0, 
          currency: curr.currency || 'EUR'
        };
      }
      acc[seller].registrations += parseInt(curr.registrations || "0");
      acc[seller].ftds += parseInt(curr.ftd_count || "0");
      acc[seller].cpa += parseInt(curr.cpa_count || "0");
      acc[seller].deposits += parseFloat(curr.deposits || "0");
      acc[seller].ngr += parseFloat(curr.net_revenue || "0");
      return acc;
    }, {});

    return NextResponse.json({ data: Object.values(sellerAgg) });
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      console.error('[Novibet] Request timed out after 10s');
      return NextResponse.json({ error: 'API da Novibet demorou muito para responder (Timeout)' }, { status: 504 });
    }
    console.error('[Novibet] Crítico:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
