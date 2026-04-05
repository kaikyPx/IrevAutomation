export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const cron = await import('node-cron');
    const { runDailySync } = await import('@/lib/sync-engine');

    console.log('[WORKER] 🤖 Robô de Sincronização Interno Iniciado!');

    // Agenda para rodar todos os dias às 09:00 AM
    // Formato: Minuto Hora DiaDoMes Mes DiaDaSemana
    cron.schedule('0 9 * * *', async () => {
      const startTime = new Date().toISOString();
      console.log(`[WORKER] 🕒 Disparando Cron Automático: ${startTime}`);
      
      try {
        const result = await runDailySync();
        console.log(`[WORKER] ✅ Sincronização Diária Concluída. ${result.count} registros processados.`);
      } catch (error) {
        console.error('[WORKER] ❌ Erro no Cron Automático:', error);
      }
    });

    // Opcional: Logar a próxima execução
    console.log('[WORKER] 📅 Próxima sincronização agendada para às 09:00 AM diariamente.');
  }
}
