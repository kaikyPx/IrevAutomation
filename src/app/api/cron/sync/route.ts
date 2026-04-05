import { NextResponse } from 'next/server';
import { runDailySync } from '@/lib/sync-engine';
import fs from 'fs';
import path from 'path';

const LOG_PATH = path.join(process.cwd(), 'src/data/cron_logs.json');

export async function GET(request: Request) {
  // Verificação de Segurança (CRON_SECRET)
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');
  const envSecret = process.env.CRON_SECRET || 'subb_cron_key_2025';

  if (secret !== envSecret) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const today = new Date().toISOString().split('T')[0];
  const startTime = new Date().toISOString();

  console.log(`[CRON] 🕒 Iniciando Sincronização Automática: ${startTime}`);

  try {
    // 1. Executa a Sincronização Diária (Calcula Deltas e Salva em irev_history.json)
    const result = await runDailySync();

    // 2. Registra o Log do Cron
    const logEntry = {
      date: today,
      startTime,
      endTime: new Date().toISOString(),
      status: 'success',
      recordsProcessed: result.count,
      brands: []
    };

    saveLog(logEntry);

    return NextResponse.json({
      message: 'Sincronização concluída com sucesso',
      summary: {
        records: result.count,
        brands: logEntry.brands
      }
    });

  } catch (error: any) {
    console.error(`[CRON] ❌ Erro na sincronização:`, error);
    
    saveLog({
      date: today,
      startTime,
      endTime: new Date().toISOString(),
      status: 'error',
      message: error.message
    });

    return NextResponse.json({ 
        error: 'Erro durante o processamento do cron', 
        details: error.message 
    }, { status: 500 });
  }
}

function saveLog(entry: any) {
  try {
    let logs: any[] = [];
    if (fs.existsSync(LOG_PATH)) {
      logs = JSON.parse(fs.readFileSync(LOG_PATH, 'utf-8'));
    }
    
    // Mantém os últimos 30 logs
    logs.unshift(entry);
    logs = logs.slice(0, 30);
    
    fs.writeFileSync(LOG_PATH, JSON.stringify(logs, null, 2));
  } catch (e) {
    console.error('[CRON] Erro ao salvar log:', e);
  }
}
