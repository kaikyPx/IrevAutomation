import { getSyncState, updateSyncState } from './db';
import { getSetting } from './settings';

interface IRevEvent {
  affiliateId: string;
  house: string;
  source: string;
  offerId: string;
  linkId: string;
  regs: number;
  ftds: number;
  cpa: number;
  deps: number;
  ngr: number;
}

export async function processIRevSync(event: IRevEvent) {
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  
  // 1. Buscar estado anterior
  let state = getSyncState(event.affiliateId, event.house, event.source);
  
  // 3. Checagem de Mês (Reset)
  if (!state || state.reference_month !== currentMonth) {
    console.log(`[IREV] Resetting state for ${event.house}/${event.source} (New Month: ${currentMonth})`);
    state = {
      last_regs: 0,
      last_ftds: 0,
      last_cpa: 0,
      last_deps: 0,
      last_ngr: 0
    };
  }

  // 4. Cálculo do Delta
  const delta = {
    regs: Math.max(0, event.regs - state.last_regs),
    ftds: Math.max(0, event.ftds - state.last_ftds),
    cpa:  Math.max(0, event.cpa  - state.last_cpa),
    deps: Math.max(0, event.deps - state.last_deps),
    ngr:  Number((event.ngr - state.last_ngr).toFixed(2))
  };

  // Se o Delta for negativo (API resetou no meio do mês), tratamos como novo acumulado
  if (event.regs < state.last_regs) delta.regs = event.regs;
  if (event.ftds < state.last_ftds) delta.ftds = event.ftds;
  if (event.deps < state.last_deps) delta.deps = event.deps;
  // Para NGR, delta negativo é comum (chargebacks/loss), mas o IREV import costuma aceitar deltas
  if (delta.ngr < 0) delta.ngr = 0; // Opcional: IREV import geralmente não gosta de NGR negativo no Delta se for via Postback de conversão

  const hasMovement = delta.regs > 0 || delta.ftds > 0 || delta.cpa > 0 || delta.deps > 0 || delta.ngr > 0;

  if (hasMovement) {
    console.log(`[IREV] 🚀 Sending Delta to IREV for ${event.house}/${event.source}:`, delta);
    
    const success = await sendToIRevAPI(event, delta);
    
    if (success) {
      // 6. Atualização do Banco
      updateSyncState({
        affiliate_id: event.affiliateId,
        house: event.house,
        source: event.source,
        last_regs: event.regs,
        last_ftds: event.ftds,
        last_cpa: event.cpa,
        last_deps: event.deps,
        last_ngr: event.ngr,
        reference_month: currentMonth
      });
    }
    return success;
  } else {
    console.log(`[IREV] ⏩ No new movement for ${event.house}/${event.source}`);
    return true; // No movement is a successful skip
  }
}

async function sendToIRevAPI(event: IRevEvent, delta: any) {
  const irevUrl = getSetting('IREV_API_URL');
  const irevKey = getSetting('IREV_API_KEY');

  if (!irevUrl || !irevKey) {
    console.warn('[IREV] ⚠️ IREV_API_URL ou IREV_API_KEY não configurados. Simulando envio...');
    return true; 
  }

  // Sanitizar URL (remover barra final se houver)
  const baseUrl = irevUrl.replace(/\/$/, '');
  const endpoint = `${baseUrl}/backend/open-api/v1/affiliates/offline-stats`;

  try {
    const payload = {
      data: [{
        affiliate_id: Number(event.affiliateId),
        offer_id: Number(event.offerId),
        link_id: Number(event.linkId) || 0,
        date: new Date().toISOString().split('T')[0],
        registrations_count: delta.regs || 0,
        ftds_count: delta.ftds || 0,
        deposit_amount: delta.deps || 0,
        net_gaming_amount: delta.ngr || 0,
        payout: delta.cpa || 0,
        revenue: 0 // Geralmente calculado automaticamente pelo IREV
      }]
    };

    console.log(`[IREV] 📡 Sending to ${endpoint}...`);
    // console.log('[IREV] Payload:', JSON.stringify(payload, null, 2));

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${irevKey}`
      },
      body: JSON.stringify(payload)
    });

    const responseText = await response.text();
    let result;
    try {
      result = JSON.parse(responseText);
    } catch (e) {
      result = responseText;
    }

    if (!response.ok) {
      const errorLog = `[IREV] ❌ API Error: ${response.status} - ${JSON.stringify(result)}\n`;
      require('fs').appendFileSync('irev_error.log', errorLog);
      console.error(errorLog);
      return false;
    }

    console.log('[IREV] ✅ API Success:', result);
    return true;
  } catch (error) {
    const errorLog = `[IREV] ❌ Connection Error: ${String(error)}\n`;
    require('fs').appendFileSync('irev_error.log', errorLog);
    console.error(errorLog);
    return false;
  }
}
