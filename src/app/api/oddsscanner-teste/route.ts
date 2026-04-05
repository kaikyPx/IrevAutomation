import { NextResponse } from 'next/server';
import dns from 'node:dns';
import fs from 'fs';
import path from 'path';
import { identifyAffiliate } from '@/lib/mapping';

// Forçar IPv4 para consistência conforme visto no script puxar.py e outras rotas
dns.setDefaultResultOrder('ipv4first');

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dateFrom = searchParams.get('date_from');
  const dateTo = searchParams.get('date_to');

  const apiKey = process.env.ODDSSCANNER_API_KEY;
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
    
    // USAR JSON DE TESTE PARA MAPEAMENTO
    const CONFIG_TESTE_PATH = path.join(process.cwd(), 'src/data/afiliateteste.json');
    const getTesteConfig = () => {
      try {
        const data = fs.readFileSync(CONFIG_TESTE_PATH, 'utf-8');
        return JSON.parse(data);
      } catch (e) { return {}; }
    };

    const identifyAffiliateTeste = (sourceName: string, brand: string) => {
      const config = getTesteConfig();
      // 1. Match Automático por #ID
      const idMatch = sourceName.match(/#(\d+)/);
      if (idMatch) {
        const extractedId = idMatch[1];
        const data = config[extractedId];
        if (data) {
          const sub = data.sub_cadastros.find((s: any) => s.nome_casa.toLowerCase() === brand.toLowerCase());
          return { affiliateId: extractedId, affiliateName: data.nome, mapping: sub || null };
        }
      }
      return null;
    };

    // Agrupar por Traffic Source Name (Vendedor) + Advertiser Name (Casa)
    const sourceAgg = records.reduce((acc: Record<string, any>, curr: any) => {
      const sourceName = curr.traffic_source_name || 'Desconhecido';
      const advertiserName = curr.advertiser_name || 'Oddsscanner';
      const key = `${sourceName}-${advertiserName}`;
      
      const affiliateInfo = identifyAffiliateTeste(sourceName, advertiserName);
      
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

      if (curr.dates && Array.isArray(curr.dates)) {
        curr.dates.forEach((dateEntry: any) => {
          const metrics = dateEntry.metrics || {};
          entry.registrations += metrics.signups || 0;
          entry.ftds += metrics.ftds || 0;
          entry.cpa += metrics.cpa_count || 0;
          entry.deposits += metrics.deposits || 0;
          entry.ngr += metrics.net_gaming_revenue || metrics.net_revenue || metrics.total_earnings || 0;
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
