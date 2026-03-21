export default function Home() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">Painel de Controle</h2>
        <p className="text-zinc-500">Acompanhe o status das suas integrações entre as casas e a IREV.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card">
          <div className="flex justify-between items-start mb-4">
            <span className="text-zinc-500 text-sm font-medium uppercase tracking-wider">Dados Sincronizados</span>
            <div className="p-2 bg-zinc-800 rounded-lg">
               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
            </div>
          </div>
          <div className="text-3xl font-bold text-white">12.482</div>
          <div className="text-xs text-emerald-500 mt-2 font-medium flex items-center gap-1">
             <span>↑ 12%</span>
             <span className="text-zinc-500 font-normal">desde a última hora</span>
          </div>
        </div>

        <div className="glass-card">
          <div className="flex justify-between items-start mb-4">
            <span className="text-zinc-500 text-sm font-medium uppercase tracking-wider">Fontes Ativas</span>
            <div className="p-2 bg-zinc-800 rounded-lg">
               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/></svg>
            </div>
          </div>
          <div className="text-3xl font-bold text-white">09 / 12</div>
          <div className="text-xs text-zinc-500 mt-2 font-medium flex items-center gap-1">
             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
             <span>Monitoramento em tempo real</span>
          </div>
        </div>

        <div className="glass-card">
          <div className="flex justify-between items-start mb-4">
            <span className="text-zinc-500 text-sm font-medium uppercase tracking-wider">Status IREV</span>
            <div className="p-2 bg-zinc-800 rounded-lg">
               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
            </div>
          </div>
          <div className="text-3xl font-bold text-emerald-500">Conectado</div>
          <div className="text-xs text-zinc-500 mt-2 font-medium flex items-center gap-1">
             <span>Latência de 45ms</span>
          </div>
        </div>
      </div>

      <div className="glass-card mt-4">
         <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-lg">Execuções Recentes</h3>
            <button className="text-xs text-zinc-400 hover:text-white transition-colors">Ver todos os logs</button>
         </div>
         
         <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b border-zinc-800/50 last:border-0 hover:bg-zinc-900/30 rounded-lg transition-colors px-2">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-zinc-800 rounded-lg flex items-center justify-center text-xs font-bold">SM</div>
                  <div>
                    <div className="font-medium">Smartico Sync</div>
                    <div className="text-xs text-zinc-500">Há {i * 15} minutos • 4.2kb transferidos</div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="text-sm font-medium">852 registros</div>
                    <div className="text-xs text-emerald-500">Sucesso</div>
                  </div>
                  <div className="p-1 bg-zinc-800 rounded-md">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                  </div>
                </div>
              </div>
            ))}
         </div>
      </div>
    </div>
  );
}
