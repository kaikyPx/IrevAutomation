export default function LogsPage() {
  const syncLogs = [
    { id: 1, type: 'FETCH', source: 'Smartico', status: 'success', time: '2026-03-21 14:30:12', result: '852 records' },
    { id: 2, type: 'FETCH', source: 'NetRefer', status: 'error', time: '2026-03-21 14:30:15', result: '401 Unauthorized' },
    { id: 3, type: 'PUSH', source: 'IREV', status: 'success', time: '2026-03-21 14:31:05', result: 'Sync Complete' },
    { id: 4, type: 'FETCH', source: 'CellXpert', status: 'success', time: '2026-03-21 15:00:02', result: '124 records' },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Logs de Sincronização</h2>
          <p className="text-zinc-500">Histórico detalhado de todas as operações de Pull e Push.</p>
        </div>
        <button className="px-4 py-2 glass border-zinc-800 text-xs font-medium rounded-lg hover:bg-zinc-900 transition-colors">
          Limpar Histórico
        </button>
      </div>

      <div className="glass-card overflow-hidden !p-0">
        <table className="w-full text-left">
          <thead className="bg-[#0c0c0c] border-b border-zinc-800">
            <tr>
              <th className="px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Tipo</th>
              <th className="px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Plataforma</th>
              <th className="px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Data / Hora</th>
              <th className="px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Resultado</th>
              <th className="px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider text-right">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50">
            {syncLogs.map((log) => (
              <tr key={log.id} className="hover:bg-zinc-900/40 transition-colors group">
                <td className="px-6 py-4 text-sm">
                  <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${
                    log.type === 'FETCH' ? 'bg-blue-500/10 text-blue-400' : 'bg-purple-500/10 text-purple-400'
                  }`}>
                    {log.type}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm font-medium text-zinc-200">{log.source}</td>
                <td className="px-6 py-4 text-sm text-zinc-500">{log.time}</td>
                <td className="px-6 py-4 text-sm">
                   <div className="flex items-center gap-2 font-medium">
                      <div className={`w-1.5 h-1.5 rounded-full ${log.status === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                      <span className={log.status === 'success' ? 'text-emerald-500' : 'text-rose-500'}>
                        {log.status === 'success' ? 'Sucesso' : 'Falha'}
                      </span>
                   </div>
                </td>
                <td className="px-6 py-4 text-sm text-zinc-400">{log.result}</td>
                <td className="px-6 py-4 text-sm text-right">
                   <button className="text-zinc-500 hover:text-white transition-colors opacity-0 group-hover:opacity-100">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
                   </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
