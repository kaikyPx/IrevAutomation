import { NextResponse } from 'next/server';
import dns from 'node:dns';
import { identifyAffiliate } from '@/lib/mapping';
import { getSetting } from '@/lib/settings';

// Forçar IPv4 para consistência de fetch
dns.setDefaultResultOrder('ipv4first');

// Bypass de SSL necessário para alguns tenants da NetRefer
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

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

  const apiKey = getSetting('STAKE_NETREFER_API_KEY');
  if (!apiKey) return NextResponse.json({ error: 'Faltando configuração da chave de API da Stake' }, { status: 500 });

  // URL 1: Resumo de Performance (Registros, FTDs, NGR por Fonte)
  // Tentando URL padrão da Stake (testando sem o prefixo brazil se o principal falhar)
  const urlSummary = `https://stakebrazil.dataexport.netrefer.com/export/reports/affiliate/XML_MS_DailyFigures_InclSubAff?apiKey=${apiKey}&yearmonthdayfrom=${dateFrom}&yearmonthdayto=${dateTo}&productID=all&PublishPointID=all`;
  const urlCustomers = `https://stakebrazil.dataexport.netrefer.com/export/reports/affiliate/XML_CustomerReporting_InclSubAff?apiKey=${apiKey}&playerID=all&username=all&websiteID=all&productID=all&brandID=all&customersource=all&customerTypeID=all&rewardplanID=all&countryID=all&FilterBySignUpDate=0&FilterByActivityDate=1&FilterByActivityDateFrom=${dateFrom}&FilterByActivityDateTo=${dateTo}`;

  try {
    const [resSummary, resCustomers] = await Promise.all([
      fetch(urlSummary, { headers: { 'Authorization': `Bearer ${apiKey}` }, next: { revalidate: 3600 } }),
      fetch(urlCustomers, { headers: { 'Authorization': `Bearer ${apiKey}` }, next: { revalidate: 3600 } })
    ]);

    if (resSummary.status === 429 || resCustomers.status === 429) {
      return NextResponse.json({ error: 'Limite de requisições excedido. Tente em 1 hora.' }, { status: 429 });
    }

    const summaryDataRaw = await resSummary.json().catch(() => []);
    const customerDataRaw = await resCustomers.json().catch(() => ({ error: true, data: [] }));

    const summaryData = Array.isArray(summaryDataRaw) ? summaryDataRaw : [];
    const customerData = Array.isArray(customerDataRaw) ? customerDataRaw : [];

    // Somar depósitos por Marketing Source ID
    const customerAgg = customerData.reduce((acc: any, curr: any) => {
      const id = String(curr["Marketing Source ID"] || "");
      if (id && id !== "0") {
        if (!acc[id]) acc[id] = { deposits: 0 };
        acc[id].deposits += parseFloat(curr["Deposits"] || "0");
      }
      return acc;
    }, {});

    const seenSourceForDeposit = new Set();
    const aggregated = summaryData
      .filter((item: any) => (item["Date"] || item["Signups"]))
      .map((item: any) => {
        const sourceId = String(item["Marketing Source ID"] || "");
        const sourceName = item["Marketing Source Name"] || "Desconhecido";
        
        // Atribuir depósitos pelo ID único da fonte
        const depositVal = (sourceId && !seenSourceForDeposit.has(sourceId)) ? (customerAgg[sourceId]?.deposits || 0) : 0;
        if (sourceId) seenSourceForDeposit.add(sourceId);
        
        const affiliateInfo = identifyAffiliate(sourceName, 'Stake');

        return {
          date: item["Date"],
          brand: item["Brand Name"] || "Stake",
          sourceId: sourceId,
          source: sourceName,
          registrations: parseInt(item["Signups"] || "0"),
          ftds: parseInt(item["First Time Depositing Customers"] || "0"),
          depositValue: depositVal,
          cpa: parseInt(item["CPA Processed"] || "0"),
          ngr: parseFloat(item["Net Revenue"] || "0"),
          product: item["Product Name"],
          affiliateName: affiliateInfo?.affiliateName || 'Não Mapeado',
          affiliateId: affiliateInfo?.affiliateId || null,
          irevConfig: affiliateInfo?.mapping || null,
        };
      });

    // Fallback caso o Summary falhe mas tenhamos dados de depósitos
    if (aggregated.length === 0 && customerData.length > 0 && !customerData[0].Message) {
        const fallback = Object.keys(customerAgg).map(id => {
            const affiliateInfo = identifyAffiliate(`ID: ${id}`, 'Stake');
            return {
                source: `ID: ${id}`,
                sourceId: id,
                brand: "Stake",
                depositValue: customerAgg[id].deposits,
                registrations: 0, ftds: 0, ngr: 0,
                affiliateName: affiliateInfo?.affiliateName || 'Não Mapeado',
                affiliateId: affiliateInfo?.affiliateId || null,
                irevConfig: affiliateInfo?.mapping || null,
            }
        });
        return NextResponse.json({ data: fallback });
    }

    return NextResponse.json({ data: aggregated });
  } catch (error: any) {
    console.error('Stake route error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
