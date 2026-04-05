import { saveHistoryEntry, db } from './db';
import { getSetting } from './settings';
import { identifyAffiliate } from './mapping';
import { processIRevSync } from './irev';

// Helper to format dates
const getDates = (offsetDays = 0) => {
  const d = new Date();
  d.setDate(d.getDate() - offsetDays);
  const dateStr = d.toISOString().split('T')[0];
  const firstDay = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  return { dateStr, firstDay };
};

export async function runDailySync() {
  const { dateStr: today, firstDay } = getDates(0); // Real today — used as DB cache key
  const { dateStr: d1 } = getDates(1); // Yesterday (D-1) — the closed reference day
  const { dateStr: d2 } = getDates(2); // Day before yesterday (D-2) — the baseline

  // We compare D-1 vs D-2 so the delta = what was added on D-1 (the last closed day).
  // Cache key = D-1 (ref day): auto-invalidates every day at midnight when D-1 advances.
  console.log(`[SYNC ENGINE] 🗄️ Syncing delta (${d2} → ${d1}), cache key = ${d1}...`);

  const brands = [
    { id: 'oddsscanner', name: 'OddsScanner' },
    { id: 'smartico', name: 'Smartico' },
    { id: 'novibet', name: 'Novibet' },
    { id: 'blaze', name: 'Blaze' },
    { id: 'sportingbet', name: 'Sportingbet' },
    { id: 'betmgm', name: 'BetMGM' },
    { id: 'stake', name: 'Stake' }
  ];

  const baseUrl = getSetting('NEXT_PUBLIC_APP_URL') || 'http://localhost:3000';

  const fetchRange = async (brandId: string, from: string, to: string) => {
    try {
      const url = `${baseUrl}/api/${brandId}?date_from=${from}&date_to=${to}`;
      const response = await fetch(url, { cache: 'no-store' });
      if (!response.ok) return [];
      const json = await response.json();
      return json.data || [];
    } catch (e) {
      return [];
    }
  };

  let totalProcessed = 0;

  for (const brand of brands) {
    console.log(`[SYNC ENGINE] 📡 Fetching ${brand.name}...`);
    
    // D-1 = yesterday (the day we want the delta for)
    // D-2 = day before yesterday (the baseline to subtract from)
    // today = current day (most recent data for IREV stateful sync)
    const [dataBaseline, dataClosed, dataCurrent] = await Promise.all([
      fetchRange(brand.id, firstDay, d2),  // cumulative MTD up to D-2
      fetchRange(brand.id, firstDay, d1),  // cumulative MTD up to D-1
      fetchRange(brand.id, firstDay, today) // cumulative MTD up to Today (Real time)
    ]);

    // Normalize house name: strips regional suffixes so "Novibet Brazil" → "Novibet",
    // "SportingBet - BR" → "SportingBet", "EstrelaBet - BR" → "EstrelaBet"
    const normalizeHouseName = (name: string): string => {
      return name
        .split(' - ')[0]   // "Blaze - BR" → "Blaze"
        .split(' (')[0]    // "Novibet (Brazil)" → "Novibet"
        .replace(/\s+(Brazil|Brasil|BR|MX|PT|ES|US)$/i, '') // "Novibet Brazil" → "Novibet"
        .trim();
    };

    const consolidate = (data: any[]) => {
      const map: Record<string, any> = {};

      // OddsScanner returns nested dates[].metrics — flatten before processing
      const flattenRecord = (item: any): any => {
        if (!item.dates || !Array.isArray(item.dates)) return item;

        let regs = 0, ftds = 0, cpa = 0, deps = 0, ngr = 0;
        item.dates.forEach((d: any) => {
          const m = d.metrics || {};
          regs += m.signups || 0;
          ftds += m.ftds || 0;
          cpa  += m.cpa_count || 0;
          deps += m.deposits || 0;
          ngr  += m.net_revenue || 0;
        });

        return { ...item, registrations: regs, ftds, cpa, deposits: deps, ngr };
      };

      data.forEach(rawItem => {
        const item = flattenRecord(rawItem);
        const source = (item.source || item.campaign_name || item.username || item.sourceId || item.traffic_source_name || 'Geral').trim();
        const rawHouse = (item.brand || item.brand_name || item.advertiser_name || brand.name).trim();
        const house = normalizeHouseName(rawHouse);
        const key = `${source.toLowerCase()}-${house.toLowerCase()}`;

        if (!map[key]) {
          let currency = item.currency || 'BRL';
          if (brand.id === 'oddsscanner' || brand.id === 'blaze' || brand.id === 'novibet') {
            currency = 'EUR';
          }
          map[key] = { source, house, regs: 0, ftds: 0, cpa: 0, deps: 0, ngr: 0, currency };
        }

        const regVal = item.registrations ?? item.signups ?? item.Signups ?? item.registration_count ?? item.Leads ?? 0;
        const ftdVal = item.ftds ?? item.FirstTimeDepositingCustomers ?? item.ftd_count ?? item.QFTD ?? 0;
        const cpaVal = item.cpa ?? item.cpa_count ?? item.CpaProcessed ?? item.CPA_Count ?? 0;
        const depVal = item.deposits ?? item.depositValue ?? item.Deposits ?? item.deposit_total ?? 0;
        const earnVal = item.ngr ?? item.calculated_ngr ?? item.total_earnings ?? item.NetRevenue ?? item.revenue ?? item.net_pl ?? 0;

        map[key].regs += Number(regVal || 0);
        map[key].ftds += Number(ftdVal || 0);
        map[key].cpa  += Number(cpaVal || 0);
        map[key].deps += Number(depVal || 0);
        map[key].ngr  += Number(earnVal || 0);
      });
      return map;
    };

    const baselineMap = consolidate(dataBaseline); // D-2 cumulative totals
    const closedMap   = consolidate(dataClosed);   // D-1 cumulative totals (closed day)
    const currentMap  = consolidate(dataCurrent);  // Today cumulative totals (stateful sync)

    const allKeys = new Set([...Object.keys(baselineMap), ...Object.keys(closedMap), ...Object.keys(currentMap)]);

    const brandItems = Array.from(allKeys).map(key => {
      const current = closedMap[key] || baselineMap[key];
      const closed   = closedMap[key]   || { regs: 0, ftds: 0, cpa: 0, deps: 0, ngr: 0 }; // D-1
      const baseline = baselineMap[key] || { regs: 0, ftds: 0, cpa: 0, deps: 0, ngr: 0 }; // D-2

      const entry = {
        date: d1,           // Cache key = D-1 (the day this delta is FOR). Auto-expires each midnight.
        brand: brand.name,
        house: current.house,
        source: current.source,
        currency: current.currency,
        // "today_*" stores D-1 (yesterday) cumulative — the reference values
        today_regs: closed.regs,
        today_ftds: closed.ftds,
        today_cpa:  closed.cpa,
        today_deps: Number(closed.deps.toFixed(2)),
        today_ngr:  Number(closed.ngr.toFixed(2)),
        // "diff_*" = D-1 minus D-2 = what was added on the last closed day
        diff_regs: Math.max(0, closed.regs - baseline.regs),
        diff_ftds: Math.max(0, closed.ftds - baseline.ftds),
        diff_cpa:  Math.max(0, closed.cpa  - baseline.cpa),
        diff_deps: Number(Math.max(0, closed.deps - baseline.deps).toFixed(2)),
        diff_ngr:  Number((closed.ngr - baseline.ngr).toFixed(2)),
        updated_at: new Date().toISOString()
      };

      // SALVA NO SQLITE PARA O DASHBOARD (Calculado em cima do dia D-1)
      saveHistoryEntry(entry);

      // --- LOGICA IREV (STATEFUL) ---
      // Sempre usa o 'currentMap' (valor mais atual da API) para calcular o Delta do IREV
      const latestData = currentMap[key];
      if (latestData) {
        const match = identifyAffiliate(latestData.source, latestData.house);
        if (match && match.mapping && match.mapping.irev_enabled !== false) {
          processIRevSync({
            affiliateId: match.affiliateId,
            house: latestData.house,
            source: latestData.source,
            offerId: match.mapping.id_oferta,
            linkId: match.mapping.id_link_oferta,
            regs: latestData.regs,
            ftds: latestData.ftds,
            cpa:  latestData.cpa,
            deps: latestData.deps,
            ngr:  latestData.ngr
          }).catch(err => console.error(`[IREV ERROR] ${latestData.house}:`, err));
        }
      }

      totalProcessed++;
      return entry;
    });
    
    await new Promise(r => setTimeout(r, 500));
  }

  console.log(`[SYNC ENGINE] ✅ SQL Sync complete. Processed ${totalProcessed} entries.`);
  return { count: totalProcessed };
}
