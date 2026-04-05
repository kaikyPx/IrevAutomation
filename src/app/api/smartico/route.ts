import { NextResponse } from 'next/server';
import dns from 'node:dns';
import { identifyAffiliate } from '@/lib/mapping';
import { getSetting } from '@/lib/settings';

// Forçar IPv4 para conexões (importante para Blaze CellXpert)
dns.setDefaultResultOrder('ipv4first');

function getBrandsConfig() {
  return [
    {
      name: 'EstrelaBet',
      host: getSetting('ESTRELABET_SMARTICO_HOST') || 'boapi.smartico.ai',
      key: getSetting('ESTRELABET_SMARTICO_API_KEY') || '2f5e7a20-26e1-11f1-b930-068c3067dc9d-453203'
    },
    {
      name: 'MultiBet',
      host: getSetting('MULTIBET_SMARTICO_HOST') || 'boapi3.smartico.ai',
      key: getSetting('MULTIBET_SMARTICO_API_KEY') || '7e99d4f8-27af-11f1-8231-027e66b7665d-552364'
    },
    {
      name: 'Casa de Aposta',
      host: getSetting('CASA_DE_APOSTA_SMARTICO_HOST') || 'boapi3.smartico.ai',
      key: getSetting('CASA_DE_APOSTA_SMARTICO_API_KEY') || '88f0d406-2877-11f1-824c-027e66b7665d-568176'
    }
  ];
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

  // Ajuste para Smartico: date_to é EXCLUSIVO. 
  let adjustedDateTo = dateTo;
  if (dateTo) {
    try {
      const d = new Date(dateTo + 'T12:00:00'); 
      d.setDate(d.getDate() + 1);
      adjustedDateTo = d.toISOString().split('T')[0];
    } catch (e) {
      console.warn('Erro ao ajustar data:', e);
    }
  }

  const BRANDS = getBrandsConfig();

  try {
    const fetchPromises = BRANDS.map(async (brand) => {
      const url = `https://${brand.host}/api/af2_media_report_af?aggregation_period=DAY&group_by=brand_id,brand_name,campaign_id,campaign_name&date_from=${dateFrom}&date_to=${adjustedDateTo}`;
      
      const response = await fetch(url, {
        headers: { 'authorization': brand.key as string },
        next: { revalidate: 3600 }
      });

      if (!response.ok) return [];
      const data = await response.json();
      return (data.data || []).map((item: any) => {
        const affiliateInfo = identifyAffiliate(item.campaign_name || '', brand.name);
        return {
          ...item,
          brand_name: brand.name,
          affiliateName: affiliateInfo?.affiliateName || 'Não Mapeado',
          affiliateId: affiliateInfo?.affiliateId || null,
          irevConfig: affiliateInfo?.mapping || null,
        };
      });
    });

    const results = await Promise.all(fetchPromises);
    const combinedData = results.flat();

    return NextResponse.json({ data: combinedData });
  } catch (error: any) {
    console.error('Smartico fetch error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
