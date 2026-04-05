'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, RefreshCw, TrendingUp, Users, Wallet, Landmark, Award, ShieldCheck, ShieldAlert, Download } from 'lucide-react';
import { exportToExcel } from '@/lib/exportUtils';

interface BetMGMData {
  date: string;
  brand: string;
  source: string;
  registrations: number;
  ftds: number;
  depositValue: number;
  cpa: number;
  ngr: number;
  product: string;
  affiliateName?: string;
  affiliateId?: string | null;
  irevConfig?: any;
}

export default function BetMGMPage() {
  const [data, setData] = useState<BetMGMData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const today = new Date().toISOString().split('T')[0];
  const firstDay = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`;

  const [dateFrom, setDateFrom] = useState(firstDay);
  const [dateTo, setDateTo] = useState(today);

  const [selectedBrand, setSelectedBrand] = useState('Geral');
  const [availableBrands, setAvailableBrands] = useState<string[]>([]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const results = await Promise.all([
        fetch(`/api/betmgm?date_from=${dateFrom}&date_to=${dateTo}`).then(r => r.json()).catch(() => ({ data: [], error: "Falha na BetMGM" })),
        fetch(`/api/stake?date_from=${dateFrom}&date_to=${dateTo}`).then(r => r.json()).catch(() => ({ data: [], error: "Falha na Stake" }))
      ]);

      const [dataBetMGM, dataStake] = results;

      if (dataBetMGM.error && dataStake.error) {
        setError("Não foi possível carregar dados de nenhuma das fontes.");
      }

      const combinedData = [
        ...(dataBetMGM.data || []),
        ...(dataStake.data || [])
      ];

      // Filtrar apenas campanhas que:
      // 1. Possuem números no nome (afiliados NetRefer)
      // 2. Têm atividade real (FTD, Reg, NGR, CPA ou Depósitos > 0)
      const filteredCombinedData = combinedData.filter((item: BetMGMData) => {
        const hasNumbers = /\d/.test(item.source || '');
        const hasActivity = 
          item.registrations > 0 || 
          item.ftds > 0 || 
          (item.cpa || 0) > 0 || 
          Math.abs(item.depositValue || 0) > 0.01 || 
          Math.abs(item.ngr || 0) > 0.01;

        return hasNumbers && hasActivity;
      });
      
      setData(filteredCombinedData);

      // Extrair marcas únicas e garantir que as esperadas existam
      const brands = Array.from(new Set(combinedData.map((d: any) => d.brand))).filter(Boolean) as string[];
      if (!brands.includes("BetMGM")) brands.push("BetMGM");
      if (!brands.includes("Stake")) brands.push("Stake");
      setAvailableBrands(brands.sort());
    } catch (err: any) {
      setError("Erro inesperado no carregamento.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dateFrom, dateTo]);

  const filteredData = selectedBrand === 'Geral' 
    ? data 
    : data.filter(d => d.brand === selectedBrand);

  const totals = filteredData.reduce((acc, curr) => ({
    regs: acc.regs + curr.registrations,
    ftds: acc.ftds + curr.ftds,
    deposits: acc.deposits + (curr.depositValue || 0),
    cpa: acc.cpa + curr.cpa,
    ngr: acc.ngr + curr.ngr,
  }), { regs: 0, ftds: 0, deposits: 0, cpa: 0, ngr: 0 });

  const sourceDataMap = filteredData.reduce((acc: any, curr) => {
    const key = curr.source || 'Direto / Geral';
    if (!acc[key]) {
      acc[key] = { 
        name: key, 
        brand: curr.brand, 
        regs: 0, 
        ftds: 0, 
        deposits: 0, 
        cpa: 0, 
        ngr: 0,
        affiliateName: curr.affiliateName,
        affiliateId: curr.affiliateId,
        irevConfig: curr.irevConfig
      };
    }
    acc[key].regs += curr.registrations;
    acc[key].ftds += curr.ftds;
    acc[key].deposits += (curr.depositValue || 0);
    acc[key].cpa += curr.cpa;
    acc[key].ngr += curr.ngr;
    return acc;
  }, {});

  const sourceData = Object.values(sourceDataMap).sort((a: any, b: any) => b.regs - a.regs);

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

  const handlePreset = (preset: 'today' | 'yesterday' | '7days' | 'month') => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    let from = todayStr, to = todayStr;
    switch (preset) {
      case 'today': break;
      case 'yesterday':
        const yesterday = new Date(); yesterday.setDate(now.getDate() - 1);
        from = yesterday.toISOString().split('T')[0]; to = from; break;
      case '7days':
        const sevenDaysAgo = new Date(); sevenDaysAgo.setDate(now.getDate() - 7);
        from = sevenDaysAgo.toISOString().split('T')[0]; break;
      case 'month':
        from = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`; break;
    }
    setDateFrom(from); setDateTo(to);
    setDateFromDisplay(toDisplay(from)); setDateToDisplay(toDisplay(to));
  };

  const handleExport = () => {
    const headers = [
      'nome do afiliado', 'id afiliado', 'nome da casa', 'id da oferta', 'link da oferta', 
      'registros', 'ftd', 'qftd', 'depositos', 'depositos valor', 'REV', 'REV VALOR'
    ];
    const csvData = sourceData.map((row: any) => [
      row.affiliateName || 'Não Mapeado',
      row.affiliateId || row.name,
      row.brand,
      row.irevConfig?.id_oferta || '',
      row.irevConfig?.id_link_oferta || '',
      row.regs,
      row.ftds,
      row.cpa,
      1, // Fixed 1 per user request
      row.deposits.toFixed(2),
      1, // Fixed 1 per user request
      row.ngr.toFixed(2)
    ]);
    exportToExcel(csvData, headers, `betmgm_stake_export_${dateFrom}_to_${dateTo}`);
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
          <h1 className="text-3xl font-bold tracking-tight text-white uppercase tracking-wider">NetRefer Performance</h1>
          <p className="text-white/40 text-sm italic">Integração BetMGM & Stake (Performance + Depósitos Financeiros).</p>
        </div>
        
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {['today', 'yesterday', '7days', 'month'].map((p) => (
              <button key={p} onClick={() => handlePreset(p as any)} className="px-4 py-1.5 rounded-full glass border border-white/5 text-[10px] font-bold uppercase tracking-wider text-white/40 hover:text-white hover:border-white/20 transition-all">{p === 'today' ? 'Hoje' : p === 'yesterday' ? 'Ontem' : p === '7days' ? '7 Dias' : 'Mês'}</button>
            ))}
            <button onClick={fetchData} className="p-2.5 glass rounded-xl text-white/60 hover:text-white group transition-all"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform'}`} /></button>
            <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2.5 glass rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-all active:scale-95 group border border-white/5">
              <Download className="w-4 h-4 group-hover:bounce" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Exportar EXCEL</span>
            </button>
          </div>
          <div className="flex items-center gap-3 p-2 px-4 glass rounded-2xl border border-white/5">
            <div className="flex flex-col"><span className="text-[8px] uppercase text-white/30 font-bold">De</span><input type="text" value={dateFromDisplay} onChange={(e) => handleDateInput(e.target.value, setDateFromDisplay, setDateFrom)} className="bg-transparent text-white text-xs outline-none w-24" /></div>
            <div className="w-px h-6 bg-white/10 mx-1" /><div className="flex flex-col"><span className="text-[8px] uppercase text-white/30 font-bold">Até</span><input type="text" value={dateToDisplay} onChange={(e) => handleDateInput(e.target.value, setDateToDisplay, setDateTo)} className="bg-transparent text-white text-xs outline-none w-24" /></div>
          </div>

          {/* Seletor de Marcas */}
          <div className="flex items-center gap-1 p-1 glass rounded-2xl border border-white/5 h-fit self-end lg:self-auto">
            <button 
              onClick={() => setSelectedBrand('Geral')}
              className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all ${selectedBrand === 'Geral' ? 'bg-blue-500 text-white' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
            >
              Geral
            </button>
            {availableBrands.map(brand => (
              <button 
                key={brand}
                onClick={() => setSelectedBrand(brand)}
                className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all ${selectedBrand === brand ? 'bg-blue-500 text-white' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
              >
                {brand}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center">{error}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          { label: "Registros", value: totals.regs, icon: Users, color: "text-blue-400" },
          { label: "FTD", value: totals.ftds, icon: Landmark, color: "text-emerald-400" },
          { label: "CPA Processados", value: totals.cpa, icon: Award, color: "text-yellow-400" },
          { label: "Depósitos (R$)", value: `R$ ${totals.deposits.toFixed(2)}`, icon: Wallet, color: "text-blue-400" },
          { label: "NGR (Net Revenue)", value: `R$ ${totals.ngr.toFixed(2)}`, icon: TrendingUp, color: (totals.ngr < 0 ? 'text-red-400' : 'text-emerald-400') },
        ].map((stat, i) => (
          <div key={i} className="glass p-5 rounded-2xl relative overflow-hidden group border border-white/5">
            <div className={`absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity ${stat.color}`}><stat.icon size={36} /></div>
            <div className="text-[9px] font-bold uppercase tracking-widest text-white/30 mb-2">{stat.label}</div>
            <div className={`text-lg font-bold tracking-tight ${stat.color}`}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="glass rounded-2xl overflow-hidden border border-white/5 shadow-2xl">
        <div className="p-6 border-b border-white/10 bg-white/2"><h2 className="text-lg font-semibold text-white uppercase tracking-widest text-sm text-blue-400">Performance por Fonte Marketing</h2></div>
        <div className="w-full overflow-x-auto text-sm">
          <table className="w-full text-left">
            <thead className="bg-white/5 text-white/40 uppercase text-[10px] tracking-widest">
              <tr>
                <th className="p-4 px-6 uppercase text-[10px] text-white/40">Status IREV</th>
                <th className="p-4 px-6">Marketing Source</th>
                <th className="p-4 px-6 text-center font-bold text-white/40 uppercase text-[9px]">Afiliado Mapeado</th>
                <th className="p-4 px-6 text-center">Registros</th>
                <th className="p-4 px-6 text-center">FTD</th>
                <th className="p-4 px-6 text-center">CPA</th>
                <th className="p-4 px-6 text-right">Depósitos (R$)</th>
                <th className="p-4 px-6 text-right">NGR (R$)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-white/70">
              {sourceData.map((source: any, i) => (
                <tr key={i} className={`hover:bg-white/5 transition-colors group ${!source.affiliateId ? 'bg-red-500/5' : ''}`}>
                  <td className="p-4 px-6 text-center">
                    {source.irevConfig?.irev_enabled ? (
                      <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[8px] font-bold uppercase ring-1 ring-emerald-500/20"><ShieldCheck className="w-3 h-3" /> Sync</div>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-red-500/10 text-red-400 text-[8px] font-bold uppercase ring-1 ring-red-500/20"><ShieldAlert className="w-3 h-3" /> No Sync</div>
                    )}
                  </td>
                  <td className="p-4 px-6">
                    <div className="font-semibold text-white uppercase text-xs break-all">{source.name}</div>
                    {selectedBrand === 'Geral' && <div className="text-[9px] text-white/30">{source.brand}</div>}
                  </td>
                  <td className="p-4 px-6 text-center">
                    {source.affiliateId ? (
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] text-white font-bold bg-white/5 px-2 py-0.5 rounded-lg border border-white/10 uppercase">{source.affiliateName}</span>
                        <span className="text-[8px] text-indigo-400 font-black mt-1 uppercase">ID: {source.irevConfig?.id_oferta || 'N/A'} | LINK: {source.irevConfig?.id_link_oferta || 'N/A'}</span>
                      </div>
                    ) : (
                      <span className="text-[9px] text-red-400/60 font-medium italic uppercase">Pendente (Linkar em Config)</span>
                    )}
                  </td>
                  <td className="p-4 px-6 text-center font-bold">{source.regs}</td>
                  <td className="p-4 px-6 text-center text-emerald-400">{source.ftds}</td>
                  <td className="p-4 px-6 text-center text-yellow-400">{source.cpa}</td>
                  <td className="p-4 px-6 text-right text-blue-400 font-medium">R$ {source.deposits.toFixed(2)}</td>
                  <td className={`p-4 px-6 text-right font-bold ${source.ngr < 0 ? 'text-red-400' : 'text-emerald-400'}`}>R$ {source.ngr.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
