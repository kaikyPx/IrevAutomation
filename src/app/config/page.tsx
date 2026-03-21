export default function ConfigPage() {
  const sources = [
    { id: 'irev', name: 'IREV (Main)', description: 'Token de faturamento e administração' },
    { id: 'smartico', name: 'Smartico', description: 'Br4bet, Estrelabet, Multibet, etc.' },
    { id: 'cellxpert', name: 'CellXpert', description: 'Blaze' },
    { id: 'netrefer', name: 'NetRefer', description: 'BetMGM, Stake' },
    { id: 'myaffiliates', name: 'MyAffiliates', description: 'Betnacional' },
    { id: 'raventrack', name: 'RavenTrack', description: 'Novibet' },
  ];

  return (
    <div className="flex flex-col gap-8 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">Configurações de API</h2>
        <p className="text-zinc-500">Insira as credenciais para que o sistema possa realizar o "Pull" e "Push" dos dados.</p>
      </div>

      <div className="space-y-6">
        {sources.map((source) => (
          <div key={source.id} className="glass-card">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="font-bold text-lg">{source.name}</h3>
                <p className="text-xs text-zinc-500">{source.description}</p>
              </div>
              <div className="flex items-center gap-2">
                 <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-1 rounded uppercase tracking-tighter">Status</span>
                 <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-700"></div>
                    Desconectado
                 </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">API Token / Secret Key</label>
                <div className="relative">
                  <input 
                    type="password" 
                    placeholder="••••••••••••••••••••••••••••"
                    className="w-full bg-black/40 border border-zinc-800 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-white cursor-pointer">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button className="px-5 py-2 glass border-zinc-700 text-sm font-medium rounded-lg hover:bg-white hover:text-black transition-all">
                Salvar Credencial
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
