'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, RefreshCw, TrendingUp, Users, Wallet, Landmark, Award, ShieldCheck, ShieldAlert, Download } from 'lucide-react';
import { exportToExcel } from '@/lib/exportUtils';

interface NovibetData {
  brand: string;
  source: string;
  registrations: number;
  ftds: number;
  cpa: number;
  deposits: number;
  ngr: number;
  currency: string;
}

export default function NovibetPage() {
  const [data, setData] = useState<NovibetData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const today = new Date().toISOString().split('T')[0];
  const firstDay = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`;

  const [dateFrom, setDateFrom] = useState(firstDay);
  const [dateTo, setDateTo] = useState(today);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/novibet?date_from=${dateFrom}&date_to=${dateTo}`);
      
      let result;
      const text = await response.text();
      
      try {
        result = JSON.parse(text);
      } catch (e) {
        console.error('Failed to parse JSON:', text);
        throw new Error(`Resposta inválida do servidor (Status: ${response.status})`);
      }

      if (!response.ok || result.error) {
        throw new Error(result.error || `Erro do servidor: ${response.status}`);
      }

      setData(result.data || []);
    } catch (err: any) {
      console.error('Fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dateFrom, dateTo]);

  const totals = data.reduce((acc, curr) => ({
    regs: acc.regs + curr.registrations,
    ftds: acc.ftds + curr.ftds,
    cpa: acc.cpa + curr.cpa,
    deposits: acc.deposits + curr.deposits,
    ngr: acc.ngr + curr.ngr,
    currency: curr.currency || acc.currency
  }), { regs: 0, ftds: 0, cpa: 0, deposits: 0, ngr: 0, currency: 'EUR' });

  const toDisplay = (iso: string) => {
    if (!iso) return '';
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  };

  const toIso = (display: string) => {
    const parts = display.split('/');
    if (parts.length !== 3) return '';
    const [d, m, y] = parts;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  };

  const [dateFromDisplay, setDateFromDisplay] = useState(toDisplay(firstDay));
  const [dateToDisplay, setDateToDisplay] = useState(toDisplay(today));

  const handleDateInput = (value: string, setter: (val: string) => void, isoSetter: (val: string) => void) => {
    let cleaned = value.replace(/\D/g, '');
    if (cleaned.length > 8) cleaned = cleaned.slice(0, 8);
    let formatted = cleaned;
    if (cleaned.length > 2) formatted = cleaned.slice(0, 2) + '/' + cleaned.slice(2);
    if (cleaned.length > 4) formatted = formatted.slice(0, 5) + '/' + cleaned.slice(4);
    setter(formatted);
    if (cleaned.length === 8) {
      const iso = toIso(formatted);
      if (iso && !isNaN(new Date(iso).getTime())) isoSetter(iso);
    }
  };

  const handleExport = () => {
    const headers = [
      'nome do afiliado', 'id afiliado', 'nome da casa', 'id da oferta', 'link da oferta', 
      'registros', 'ftd', 'qftd', 'depositos', 'depositos valor', 'REV', 'REV VALOR'
    ];
    const csvData = data.map((row: any) => [
      row.affiliateName || 'Não Mapeado',
      row.affiliateId || row.source,
      row.brand || 'Novibet',
      row.irevConfig?.id_oferta || '',
      row.irevConfig?.id_link_oferta || '',
      row.registrations,
      row.ftds,
      row.cpa,
      1, // Fixed 1 per user request
      row.deposits.toFixed(2),
      1, // Fixed 1 per user request
      row.ngr.toFixed(2)
    ]);
    exportToExcel(csvData, headers, `novibet_export_${dateFrom}_to_${dateTo}`);
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
    </div>
  );

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-white/40 text-sm mb-2 hover:text-white transition-colors cursor-pointer" onClick={() => window.location.href = '/'}>
            <ArrowLeft className="w-4 h-4" /> Voltar ao Dashboard
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white uppercase tracking-wider">Novibet Performance</h1>
          <p className="text-white/40 text-sm italic">Métricas de Conversão e Financeiro (RavenTrack).</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 p-2 px-4 glass rounded-2xl border border-white/5">
            <div className="flex flex-col"><span className="text-[8px] uppercase text-white/30 font-bold">De</span><input type="text" value={dateFromDisplay} onChange={(e) => handleDateInput(e.target.value, setDateFromDisplay, setDateFrom)} className="bg-transparent text-white text-xs outline-none w-24" /></div>
            <div className="w-px h-6 bg-white/10 mx-1" /><div className="flex flex-col"><span className="text-[8px] uppercase text-white/30 font-bold">Até</span><input type="text" value={dateToDisplay} onChange={(e) => handleDateInput(e.target.value, setDateToDisplay, setDateTo)} className="bg-transparent text-white text-xs outline-none w-24" /></div>
          </div>
          <button onClick={fetchData} className="p-2.5 glass rounded-xl text-white/60 hover:text-white group transition-all"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform'}`} /></button>
          <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2.5 glass rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-all active:scale-95 group border border-white/5 h-[42px]">
            <Download className="w-4 h-4 group-hover:bounce" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Exportar EXCEL</span>
          </button>
        </div>
      </div>

      {error && <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center">{error}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          { label: "Registros", value: totals.regs, icon: Users, color: "text-blue-400" },
          { label: "FTD", value: totals.ftds, icon: Landmark, color: "text-emerald-400" },
          { label: "CPA Processados", value: totals.cpa, icon: Award, color: "text-yellow-400" },
          { label: `Depósitos (${totals.currency})`, value: `${totals.currency === 'EUR' ? '€' : 'R$'} ${totals.deposits.toFixed(2)}`, icon: Wallet, color: "text-blue-400" },
          { label: `NGR (${totals.currency})`, value: `${totals.currency === 'EUR' ? '€' : 'R$'} ${totals.ngr.toFixed(2)}`, icon: TrendingUp, color: (totals.ngr < 0 ? 'text-red-400' : 'text-emerald-400') },
        ].map((stat, i) => (
          <div key={i} className="glass p-5 rounded-2xl relative overflow-hidden group border border-white/5">
            <div className={`absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity ${stat.color}`}><stat.icon size={36} /></div>
            <div className="text-[9px] font-bold uppercase tracking-widest text-white/30 mb-2">{stat.label}</div>
            <div className={`text-lg font-bold tracking-tight ${stat.color}`}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="glass rounded-2xl overflow-hidden border border-white/5 shadow-2xl">
        <div className="p-6 border-b border-white/10 bg-white/2"><h2 className="text-lg font-semibold text-white uppercase tracking-widest text-sm text-indigo-400">Detalhamento por Vendedor (Novibet)</h2></div>
        <div className="w-full overflow-x-auto text-sm">
          <table className="w-full text-left">
            <thead className="bg-white/5 text-white/40 uppercase text-[10px] tracking-widest">
              <tr>
                <th className="p-4 px-6 uppercase text-[10px] text-white/40">Status IREV</th>
                <th className="p-4 px-6">Vendedor (Username)</th>
                <th className="p-4 px-6 text-center font-bold text-white/40 uppercase text-[9px]">Afiliado Mapeado</th>
                 <th className="p-4 px-6 text-center text-orange-400">Reg</th>
                <th className="p-4 px-6 text-center">FTD</th>
                <th className="p-4 px-6 text-center">CPA</th>
                <th className="p-4 px-6 text-right">Depósitos ({totals.currency})</th>
                <th className="p-4 px-6 text-right">NGR ({totals.currency})</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-white/70">
              {data.map((row: any, i) => (
                <tr key={i} className={`hover:bg-white/5 transition-colors ${!row.affiliateId ? 'bg-red-500/5 opacity-80' : ''}`}>
                  <td className="p-4 px-6 text-center">
                    {row.irevConfig?.irev_enabled ? (
                      <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[8px] font-bold uppercase ring-1 ring-emerald-500/20"><ShieldCheck className="w-3 h-3" /> Sync</div>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-red-500/10 text-red-400 text-[8px] font-bold uppercase ring-1 ring-red-500/20"><ShieldAlert className="w-3 h-3" /> No Sync</div>
                    )}
                  </td>
                  <td className="p-4 px-6 font-semibold text-white uppercase text-xs">{row.source}</td>
                  <td className="p-4 px-6 text-center">
                    {row.affiliateId ? (
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] text-white font-bold bg-white/5 px-2 py-0.5 rounded-lg border border-white/10 uppercase">{row.affiliateName}</span>
                        <span className="text-[8px] text-indigo-400 font-black mt-1 uppercase">ID: {row.irevConfig?.id_oferta || 'N/A'} | LINK: {row.irevConfig?.id_link_oferta || 'N/A'}</span>
                      </div>
                    ) : (
                      <span className="text-[9px] text-red-400/60 font-medium italic">Pendente (Linkar em Config)</span>
                    )}
                  </td>
                  <td className="p-4 px-6 text-center font-bold">{row.registrations}</td>
                  <td className="p-4 px-6 text-center text-emerald-400">{row.ftds}</td>
                  <td className="p-4 px-6 text-center text-yellow-400">{row.cpa}</td>
                  <td className="p-4 px-6 text-right text-blue-400 font-medium">{row.currency === 'EUR' ? '€' : 'R$'} {row.deposits.toFixed(2)}</td>
                  <td className={`p-4 px-6 text-right font-bold ${row.ngr < 0 ? 'text-red-400' : 'text-emerald-400'}`}>{row.currency === 'EUR' ? '€' : 'R$'} {row.ngr.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
