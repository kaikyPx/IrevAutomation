import { NextResponse } from 'next/server';
import dns from 'node:dns';
import { identifyAffiliate } from '@/lib/mapping';
import { getSetting } from '@/lib/settings';

// Forçar IPv4 para conexões (importante para Blaze CellXpert)
dns.setDefaultResultOrder('ipv4first');

// Auxiliar para extrair valores simples de XML do CellXpert
function getXmlValue(row: string, field: string): string {
  const regex = new RegExp(`<${field}>(.*?)<\/${field}>`, 'is');
  const match = row.match(regex);
  return match ? match[1].trim() : '0';
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  let dateFrom = searchParams.get('date_from');
  let dateTo = searchParams.get('date_to');

  if (!dateFrom || !dateTo) {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    if (!dateFrom) dateFrom = `${year}-${month}-01`;
    if (!dateTo) dateTo = `${year}-${month}-${day}`;
  }

  const affiliateId = getSetting('BLAZER_AFFILIATE_ID') || '52547';
  const apiKey = getSetting('BLAZER_API_KEY') || 'b474fd0c8223fd0f875e9b8a187ecf49fb217481fd49e0a75eac593f8501704175cb98d573180576565707c7f1';
  const host = 'go.blaze.partners';

  try {
    const url = `https://${host}/api/?command=mediareport&fromdate=${dateFrom}&todate=${dateTo}&Brand=1&Day=1&TrackingCode=1&Name=1`;
    console.log(`Fetching Blaze data: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'affiliateid': affiliateId,
        'x-api-key': apiKey
      },
      cache: 'no-store'
    });

    if (!response.ok) {
        console.error(`Blaze API error: ${response.status}`);
        return NextResponse.json({ data: [] });
    }
    
    const xml = await response.text();
    
    // Parsing simplificado, mas robusto, de XML do CellXpert
    const rows = xml.split('<row>').slice(1);
    const data = rows.map(row => {
      const rawDate = getXmlValue(row, 'Day'); // YYYY/MM/DD
      const dt = rawDate ? rawDate.replace(/\//g, '-') : dateFrom;
      
      // Prioriza Tracking_Code pois no CellXpert ele geralmente identifica o subafiliado/campanha
      const trackingCode = getXmlValue(row, 'Tracking_Code');
      const name = getXmlValue(row, 'Name');
      const campaign = (trackingCode && trackingCode !== '0' && trackingCode !== 'Default' && trackingCode !== 'none') 
                         ? trackingCode 
                         : (name && name !== 'none' && name !== '0' ? name : 'Direto / Geral');

      const qftdCount = parseInt(getXmlValue(row, 'QFTD')) || 0;
      const commission = parseFloat(getXmlValue(row, 'Commission')) || 0;
      
      // Fórmula: NGR = (Comissão - (QFTD * 30)) / 0.35
      const calculatedNgr = (commission - (qftdCount * 30)) / 0.35;

      const affiliateInfo = identifyAffiliate(campaign, 'Blaze');

      return {
        dt,
        brand_name: 'Blaze',
        campaign_name: campaign,
        visit_count: parseInt(getXmlValue(row, 'Unique_Visitors')) || parseInt(getXmlValue(row, 'Visitors')) || 0,
        registration_count: parseInt(getXmlValue(row, 'Registrations')) || parseInt(getXmlValue(row, 'Leads')) || 0,
        ftd_count: parseInt(getXmlValue(row, 'FTD')) || qftdCount || 0,
        qftd_count: qftdCount,
        deposit_count: 0,
        deposit_total: parseFloat(getXmlValue(row, 'Deposits')) || 0,
        net_pl: commission,
        calculated_ngr: calculatedNgr,
        currency: 'EUR',
        affiliateName: affiliateInfo?.affiliateName || 'Não Mapeado',
        affiliateId: affiliateInfo?.affiliateId || null,
        irevConfig: affiliateInfo?.mapping || null,
      };
    });

    console.log(`Blaze data returned: ${data.length} rows`);
    return NextResponse.json({ data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Blaze fetch error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
