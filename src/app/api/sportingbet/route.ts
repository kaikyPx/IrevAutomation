import { NextResponse } from 'next/server';
import { XMLParser } from 'fast-xml-parser';
import dns from 'node:dns';
import { getSetting } from '@/lib/settings';
import { identifyAffiliate } from '@/lib/mapping';

// Forçar IPv4 para consistência
dns.setDefaultResultOrder('ipv4first');

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  
  // Suportar date_from/date_to para integração com IREV Diff
  const dateFrom = searchParams.get('date_from');
  const dateTo = searchParams.get('date_to');
  
  // Sportingbet (Entain) espera formato DD/MM/YYYY
  const formatSBDate = (iso: string) => {
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  };

  let dateStart = dateFrom ? formatSBDate(dateFrom) : '';
  let dateEnd = dateTo ? formatSBDate(dateTo) : '';

  // Se não houver range, padrão é hoje
  if (!dateStart) {
    const now = new Date();
    dateStart = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
    dateEnd = dateStart;
  }

  const benId = getSetting('SPORTINGBET_BEN_ID');
  const xmlKey = getSetting('SPORTINGBET_XML_KEY');

  if (!benId || !xmlKey) {
    return NextResponse.json({ error: 'Configurações da Sportingbet ausentes' }, { status: 500 });
  }

  // Se houver um range, a API da Sportingbet/Entain pode não suportar via XML stats simples (algumas versões só aceitam 'date' único)
  const url = `https://www.entainpartners.com/StatsBetaXml.do?benId=${benId}&brandGroupCodes=8&product=ALL&date=${dateEnd}&fromdate=${dateStart}&todate=${dateEnd}&groupby=Campaign&xml_key=${xmlKey}&currency=BRL&attribs=true,true,true,true,true,true,true,true,true,true,true,true,true,true`;

  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      cache: 'no-store'
    });

    if (!response.ok) return NextResponse.json({ data: [] });

    const xmlText = await response.text();
    if (xmlText.includes('Attention Required')) {
        console.error('Sportingbet Cloudflare block detected');
        return NextResponse.json({ error: 'Bloqueio Cloudflare (Abra no navegador)', url }, { status: 403 });
    }

    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "" });
    const jsonObj = parser.parse(xmlText);
    const filter = jsonObj.groupby?.filter;

    if (!filter) return NextResponse.json({ data: [] });

    let campaigns = filter.Campaign || [];
    if (!Array.isArray(campaigns)) campaigns = [campaigns];

    const data = campaigns.map((c: any) => {
      const campaignName = c.code || 'Geral';
      const affiliateInfo = identifyAffiliate(campaignName, 'Sportingbet');

      return {
        dt: dateEnd,
        brand_name: 'Sportingbet',
        campaign_name: campaignName,
        registration_count: parseInt(c.Registrations || "0"),
        ftd_count: parseInt(c.FTDs || "0"),
        deposit_total: parseFloat(c.Deposits || "0"),
        net_pl: parseFloat(c.Total_NGR || "0"), // NGR total
        qftd_count: parseInt(c.CPA_Count || "0"),
        affiliateName: affiliateInfo?.affiliateName || 'Não Mapeado',
        affiliateId: affiliateInfo?.affiliateId || null,
        irevConfig: affiliateInfo?.mapping || null,
        method: affiliateInfo?.method || 'none'
      };
    });

    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
