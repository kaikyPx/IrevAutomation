import { NextResponse } from 'next/server';
import dns from 'node:dns';
import { identifyAffiliate } from '@/lib/mapping';
import { getSetting } from '@/lib/settings';

// Forçar IPv4 para consistência conforme visto no script puxar.py e outras rotas
dns.setDefaultResultOrder('ipv4first');

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dateFrom = searchParams.get('date_from');
  const dateTo = searchParams.get('date_to');

  const apiKey = getSetting('ODDSSCANNER_API_KEY');
  const baseUrl = "https://api-partners.oddsscanner.com/api/v1/reports/sources";

  if (!apiKey) {
    return NextResponse.json({ error: 'Faltando configuração da API Key do OddsScanner' }, { status: 500 });
  }

  try {
    let allRecords: any[] = [];
    let currentPage = 1;
    const pageSize = 100;
    let hasMore = true;

    while (hasMore) {
      const url = new URL(baseUrl);
      if (dateFrom) url.searchParams.append('start_date', dateFrom);
      if (dateTo) url.searchParams.append('end_date', dateTo);
      url.searchParams.append('page', currentPage.toString());
      url.searchParams.append('page_size', pageSize.toString());

      const response = await fetch(url.toString(), {
        headers: {
          'X-API-Key': apiKey,
          'Accept': 'application/json'
        },
        next: { revalidate: 3600 }
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        return NextResponse.json({ 
          error: `OddsScanner Error: ${response.status} - ${errData.message || response.statusText}` 
        }, { status: response.status });
      }

      const json = await response.json();
      const records = json.data || [];
      allRecords = [...allRecords, ...records];

      if (records.length < pageSize) {
        hasMore = false;
      } else {
        currentPage++;
      }
    }

    const records = allRecords;

    // Agrupar por Traffic Source Name (Vendedor) + Advertiser Name (Casa) para não juntar tudo
    const sourceAgg = records.reduce((acc: Record<string, any>, curr: any) => {
      const sourceName = curr.traffic_source_name || 'Desconhecido';
      const advertiserName = curr.advertiser_name || 'Oddsscanner';
      const key = `${sourceName}-${advertiserName}`;
      
      const affiliateInfo = identifyAffiliate(sourceName, advertiserName);
      
      if (!acc[key]) {
        acc[key] = {
          brand: advertiserName,
          source: sourceName,
          affiliateName: affiliateInfo?.affiliateName || 'Não Mapeado',
          affiliateId: affiliateInfo?.affiliateId || null,
          irevConfig: affiliateInfo?.mapping || null,
          registrations: 0,
          ftds: 0,
          cpa: 0,
          deposits: 0,
          ngr: 0,
          currency: 'EUR'
        };
      }
      
      const entry = acc[key];

      // Somar métricas de todas as datas retornadas para este source/advertiser
      if (curr.dates && Array.isArray(curr.dates)) {
        curr.dates.forEach((dateEntry: any) => {
          const metrics = dateEntry.metrics || {};
          entry.registrations += metrics.signups || 0;
          entry.ftds += metrics.ftds || 0;
          entry.cpa += metrics.cpa_count || 0;
          entry.deposits += metrics.deposits || 0;
          // Usar especificamente o campo net_revenue conforme solicitado
          entry.ngr += metrics.net_revenue || 0;
        });
      }

      return acc;
    }, {});

    return NextResponse.json({ data: Object.values(sourceAgg) });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('OddsScanner route error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
