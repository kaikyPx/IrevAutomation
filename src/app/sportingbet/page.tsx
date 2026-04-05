'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, RefreshCw, TrendingUp, Users, Wallet, Landmark, Award, ShieldCheck, ShieldAlert, MousePointer2, Download } from 'lucide-react';
import { exportToExcel } from '@/lib/exportUtils';

interface SportingbetData {
  dt: string;
  brand_name: string;
  campaign_name: string;
  registration_count: number;
  ftd_count: number;
  deposit_total: number;
  net_pl: number;
  qftd_count: number;
  affiliateName?: string;
  affiliateId?: string | null;
  irevConfig?: any;
}

export default function SportingbetPage() {
  const [data, setData] = useState<SportingbetData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiUrl, setApiUrl] = useState<string | null>(null);

  // Default date: today in DD/MM/YYYY format for Sportingbet (Entain)
  const now = new Date();
  const todayStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
  const [dateParam, setDateParam] = useState(todayStr);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    setApiUrl(null);
    try {
      const response = await fetch(`/api/sportingbet?date=${dateParam}&t=${Date.now()}`);
      const result = await response.json();
      
      if (!response.ok) {
        if (response.status === 403 && result.url) {
            setApiUrl(result.url);
        }
        throw new Error(result.error || 'Erro na requisição');
      }
      
      let resData = result.data || [];
      
      // Filtrar apenas campanhas que:
      // 1. Possuem números no nome (indicando que pertencem a um afiliado)
      // 2. Têm atividade real
      resData = resData.filter((item: SportingbetData) => {
        const hasNumbers = /\d/.test(item.campaign_name || '');
        const hasActivity = 
          item.registration_count > 0 || 
          item.ftd_count > 0 || 
          item.deposit_total > 0 || 
          Math.abs(item.net_pl) > 0.01;

        return hasNumbers && hasActivity;
      });

      setData(resData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dateParam]);

  const totals = data.reduce((acc, curr) => ({
    regs: acc.regs + curr.registration_count,
    ftds: acc.ftds + curr.ftd_count,
    deposits: acc.deposits + curr.deposit_total,
    ngr: acc.ngr + curr.net_pl,
    qftds: acc.qftds + (curr.qftd_count || 0),
  }), { regs: 0, ftds: 0, deposits: 0, ngr: 0, qftds: 0 });

  const handleDateInput = (value: string) => {
    let cleaned = value.replace(/\D/g, '');
    if (cleaned.length > 8) cleaned = cleaned.slice(0, 8);
    let formatted = cleaned;
    if (cleaned.length > 2) formatted = cleaned.slice(0, 2) + '/' + cleaned.slice(2);
    if (cleaned.length > 4) formatted = formatted.slice(0, 5) + '/' + cleaned.slice(4);
    setDateParam(formatted);
  };

  const handleExport = () => {
    const headers = [
      'nome do afiliado', 'id afiliado', 'nome da casa', 'id da oferta', 'link da oferta', 
      'registros', 'ftd', 'qftd', 'depositos', 'depositos valor', 'REV', 'REV VALOR'
    ];
    const csvData = data.map((row: any) => [
      row.affiliateName || 'Não Mapeado',
      row.affiliateId || row.campaign_name,
      row.brand_name || 'Sportingbet',
      row.irevConfig?.id_oferta || '',
      row.irevConfig?.id_link_oferta || '',
      row.registration_count,
      row.ftd_count,
      row.qftd_count,
      1, // Fixed 1 per user request
      row.deposit_total.toFixed(2),
      1, // Fixed 1 per user request
      row.net_pl.toFixed(2)
    ]);
    exportToExcel(csvData, headers, `sportingbet_export_${dateParam?.replace(/\//g, '-')}`);
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-white/40 text-sm mb-2 hover:text-white transition-colors cursor-pointer" onClick={() => window.location.href = '/'}>
            <ArrowLeft className="w-4 h-4" /> Voltar ao Dashboard
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white uppercase tracking-wider">Sportingbet (Entain)</h1>
          <p className="text-white/40 text-sm italic">Performance via Entain Partners XML Feed.</p>
        </div>
        
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 p-2 px-4 glass rounded-2xl border border-white/5 shadow-inner">
                <div className="flex flex-col">
                  <span className="text-[8px] uppercase text-white/30 font-bold mb-0.5">Relatório do Dia</span>
                  <input 
                    type="text" 
                    value={dateParam} 
                    placeholder="DD/MM/YYYY" 
                    onChange={(e) => handleDateInput(e.target.value)} 
                    className="bg-transparent text-white text-xs outline-none w-32 font-medium" 
                  />
                </div>
            </div>
            <button onClick={fetchData} className="p-2.5 glass rounded-xl text-white/60 hover:text-white group transition-all active:scale-95 shadow-lg">
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
            </button>
            <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2.5 glass rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-all active:scale-95 group border border-white/5 shadow-lg">
              <Download className="w-4 h-4 group-hover:bounce" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Exportar EXCEL</span>
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
      ) : error ? (
        <div className="p-8 glass rounded-2xl border border-red-500/20 text-center space-y-4">
          <h2 className="text-xl font-bold text-red-500">Erro de Integração Sportingbet</h2>
          <p className="text-white/40 max-w-md mx-auto">{error}</p>
          {apiUrl && (
            <div className="pt-4">
                <a href={apiUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 rounded-xl text-white font-bold hover:bg-red-500 shadow-lg shadow-red-900/40 transition-all uppercase text-[10px] tracking-widest">
                    <MousePointer2 className="w-4 h-4" /> Abrir no Navegador (Bypass)
                </a>
                <p className="text-[10px] text-white/20 mt-3 italic">Dica: Após carregar o XML no navegador, volte aqui e atualize.</p>
            </div>
          )}
          {!apiUrl && <button onClick={fetchData} className="px-6 py-2 bg-indigo-500 rounded-lg text-white font-bold hover:bg-indigo-600 transition-colors">Tentar Novamente</button>}
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { label: "Registros", value: totals.regs, icon: Users, color: "text-blue-400" },
              { label: "FTDs", value: totals.ftds, icon: Landmark, color: "text-emerald-400" },
              { label: "CPA (QFTD)", value: totals.qftds, icon: Award, color: "text-orange-400" },
              { label: "Depósitos (R$)", value: `R$ ${totals.deposits.toFixed(2)}`, icon: Wallet, color: "text-blue-300" },
              { label: "NGR (R$)", value: `R$ ${totals.ngr.toFixed(2)}`, icon: TrendingUp, color: (totals.ngr < 0 ? 'text-red-400' : 'text-emerald-400') },
            ].map((stat, i) => (
              <div key={i} className="glass p-5 rounded-2xl relative overflow-hidden group border border-white/5 shadow-xl">
                <div className={`absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity ${stat.color}`}>
                  <stat.icon size={36} />
                </div>
                <div className="text-[9px] font-bold uppercase tracking-widest text-white/30 mb-2">{stat.label}</div>
                <div className={`text-lg font-bold tracking-tight ${stat.color}`}>{stat.value}</div>
              </div>
            ))}
          </div>

          {/* Tabela de Campanhas */}
          <div className="glass rounded-2xl overflow-hidden border border-white/5 shadow-2xl">
            <div className="p-6 border-b border-white/10 bg-white/2 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2 uppercase tracking-widest text-sm">
                <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                Desempenho por Campanha
              </h2>
            </div>
            <div className="w-full overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-white/5 text-white/40 uppercase text-[10px] tracking-widest">
                  <tr>
                    <th className="p-4 px-6">Status IREV</th>
                    <th className="p-4 px-6">Campanha</th>
                    <th className="p-4 px-6 text-center">Afiliado Mapeado</th>
                    <th className="p-4 px-6 text-center">Registros</th>
                    <th className="p-4 px-6 text-center">FTDs</th>
                    <th className="p-4 px-6 text-center">CPA</th>
                    <th className="p-4 px-6 text-right">Depósitos (R$)</th>
                    <th className="p-4 px-6 text-right font-bold">NGR (R$)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-white/70">
                  {data.map((campaign, i) => (
                    <tr key={i} className={`hover:bg-white/5 transition-colors group ${!campaign.affiliateId ? 'bg-red-500/5' : ''}`}>
                      <td className="p-4 px-6 text-center">
                        {campaign.irevConfig?.irev_enabled ? (
                          <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[8px] font-bold uppercase ring-1 ring-emerald-500/20"><ShieldCheck className="w-3 h-3" /> Sync</div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-red-500/10 text-red-400 text-[8px] font-bold uppercase ring-1 ring-red-500/20"><ShieldAlert className="w-3 h-3" /> No Sync</div>
                        )}
                      </td>
                      <td className="p-4 px-6">
                        <div className="font-semibold text-white group-hover:text-blue-400 transition-colors uppercase text-xs break-all truncate max-w-[200px]">{campaign.campaign_name}</div>
                      </td>
                      <td className="p-4 px-6 text-center">
                        {campaign.affiliateId ? (
                          <div className="flex flex-col items-center">
                            <span className="text-[10px] text-white font-bold bg-white/5 px-2 py-0.5 rounded-lg border border-white/10 uppercase">{campaign.affiliateName}</span>
                            <span className="text-[8px] text-blue-400 font-black mt-1 uppercase">ID: {campaign.irevConfig?.id_oferta || 'N/A'} | LINK: {campaign.irevConfig?.id_link_oferta || 'N/A'}</span>
                          </div>
                        ) : (
                          <span className="text-[9px] text-red-400/60 font-medium italic uppercase">Pendente (Config)</span>
                        )}
                      </td>
                      <td className="p-4 px-6 text-center font-bold">{campaign.registration_count}</td>
                      <td className="p-4 px-6 text-center text-emerald-400 font-medium">{campaign.ftd_count}</td>
                      <td className="p-4 px-6 text-center text-orange-400 font-medium">{campaign.qftd_count}</td>
                      <td className="p-4 px-6 text-right font-medium text-white">R$ {campaign.deposit_total.toFixed(2)}</td>
                      <td className={`p-4 px-6 text-right font-bold ${campaign.net_pl < 0 ? 'text-red-400' : 'text-emerald-400'}`}>R$ {campaign.net_pl.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
