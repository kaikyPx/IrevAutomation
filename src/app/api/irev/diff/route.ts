import { NextResponse } from 'next/server';
import { runDailySync } from '@/lib/sync-engine';
import { getHistoryByDate, db } from '@/lib/db';
import { getAffiliatesConfig, AffiliateMapping, identifyAffiliate } from '@/lib/mapping';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const force = searchParams.get('force') === 'true';

  // D-1 = yesterday = the closed reference day this report is FOR
  // D-2 = day before yesterday = the baseline
  const d1Date = new Date(); d1Date.setDate(d1Date.getDate() - 1);
  const d2Date = new Date(); d2Date.setDate(d2Date.getDate() - 2);
  const fmt = (d: Date) => d.toISOString().split('T')[0];
  const d1 = fmt(d1Date);
  const d2 = fmt(d2Date);
  const today = new Date().toISOString().split('T')[0]; // real calendar date

  // Look up data by D-1 — the cache key used by the sync engine
  let historyData = getHistoryByDate(d1);

  if (historyData.length === 0 || force) {
    try {
      console.log(`[IREV DIFF] No data for ref day ${d1} or forced. Starting Sync...`);
      if (force) {
        db.prepare('DELETE FROM history WHERE date = ?').run(d1);
        console.log(`[IREV DIFF] Cleared stale records for ${d1}`);
      }
      await runDailySync();
      historyData = getHistoryByDate(d1);
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  // Mapeia os dados do SQL para o formato que o Frontend espera
  const formattedData = historyData.map((d: any) => ({
    brand: d.brand,
    house: d.house,
    source: d.source,
    currency: d.currency,
    diffRegs: d.diff_regs,
    diffFtds: d.diff_ftds,
    diffCpa: d.diff_cpa,
    diffDeposits: d.diff_deps,
    diffNgr: d.diff_ngr,
    totalRegs: d.today_regs,
    audit: {
      regs: { t: d.today_regs, y: d.today_regs - d.diff_regs },
      ftds: { t: d.today_ftds, y: d.today_ftds - d.diff_ftds },
      cpa: { t: d.today_cpa,  y: d.today_cpa  - d.diff_cpa  },
      deps: { t: d.today_deps, y: Number((d.today_deps - d.diff_deps).toFixed(2)) },
      ngr:  { t: d.today_ngr,  y: Number((d.today_ngr  - d.diff_ngr ).toFixed(2)) }
    }
  }));

  return NextResponse.json({ 
    source: 'sqlite',
    dates: {
      today,
      refDay: d1,          // D-1: the closed day this result represents
      baselineDay: d2,     // D-2: the baseline subtracted from D-1
      label: `${d2} → ${d1}`,
      updatedAt: new Date().toISOString()
    },
    brands: regroupByHouse(formattedData) 
  });
}

function normalizeHouse(name: string) {
  // Strip suffix after " - " or " (" and lowercase-normalize for comparison
  return name.split(' - ')[0].split(' (')[0].trim();
}

function housesMatch(a: string, b: string) {
  return a.toLowerCase() === b.toLowerCase();
}

function regroupByHouse(flatDeltas: any[]) {
    const config = getAffiliatesConfig() as Record<string, AffiliateMapping>;
    // key = lowercase house name — prevents "Multibet" vs "MultiBet" duplicates
    const houseAgg: Record<string, { displayName: string; items: any[] }> = {};

    const getOrCreate = (rawName: string) => {
      const key = rawName.toLowerCase();
      if (!houseAgg[key]) houseAgg[key] = { displayName: rawName, items: [] };
      return houseAgg[key].items;
    };

    // 1. Inicializar com as Casas que existem na configuração
    Object.entries(config).forEach(([id, aff]) => {
      aff.sub_cadastros.forEach(sub => {
        const house = normalizeHouse(sub.nome_casa);
        const items = getOrCreate(house);

        // Use d.house (real casa) and compare case-insensitively
        const hasDelta = flatDeltas.some(d => {
            const dHouse = normalizeHouse(d.house || '');
            if (!housesMatch(dHouse, house)) return false;
            const match = identifyAffiliate(d.source, dHouse);
            return match && match.affiliateId === id;
        });

        if (!hasDelta) {
          items.push({
            brand: house,
            house: house,
            source: sub.external_id || aff.nome,
            affiliateName: aff.nome,
            affiliateId: id,
            irevConfig: { id_oferta: sub.id_oferta, id_link_oferta: sub.id_link_oferta },
            currency: 'EUR',
            diffRegs: 0,
            diffFtds: 0,
            diffCpa: 0,
            diffDeposits: 0,
            diffNgr: 0,
            totalRegs: 0,
            isMappedPlaceholder: true
          });
        }
      });
    });

    // 2. Processar os Deltas reais e mapear
    flatDeltas.forEach(curr => {
      const rawHouse = curr.house || 'Diverso';
      const house = normalizeHouse(rawHouse);
      const items = getOrCreate(house);

      const match = identifyAffiliate(curr.source, house);
      items.push({ 
        ...curr, 
        house,
        affiliateName: match?.affiliateName || 'Não Mapeado',
        affiliateId: match?.affiliateId || null,
        irevConfig: match?.mapping || null,
        isMapped: !!match
      });
    });

    // 3. Deduplicate: se o delta real substituir o placeholder, remove o placeholder
    Object.values(houseAgg).forEach(bucket => {
        const uniqueItems = new Map<string, any>();
        bucket.items.forEach(item => {
            const key = `${(item.source || '').toLowerCase()}-${(item.house || '').toLowerCase()}`;
            if (!uniqueItems.has(key) || !item.isMappedPlaceholder) {
                uniqueItems.set(key, item);
            }
        });
        bucket.items = Array.from(uniqueItems.values());
    });

    const finalResults = Object.values(houseAgg).map(bucket => ({
      brand: bucket.displayName,
      data: bucket.items,
      platform: [...new Set(bucket.items.map((d: any) => d.brand).filter(Boolean))].join(', ') || bucket.displayName,
      hasMovement: bucket.items.some((d: any) => d.diffRegs > 0 || d.diffFtds > 0 || Math.abs(d.diffNgr || 0) > 0.01)
    }));

    return finalResults.sort((a, b) => (b.hasMovement ? 1 : 0) - (a.hasMovement ? 1 : 0));
}
