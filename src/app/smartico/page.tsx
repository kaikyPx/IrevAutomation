'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, RefreshCw, TrendingUp, Users, Wallet, Landmark, Award, ShieldCheck, ShieldAlert, Download } from 'lucide-react';
import { exportToExcel } from '@/lib/exportUtils';

interface SmarticoData {
  dt: string;
  brand_name: string;
  campaign_name: string;
  visit_count: number;
  registration_count: number;
  ftd_count: number;
  qftd_count: number;
  deposit_count: number;
  deposit_total: number;
  net_pl: number;
  affiliateName?: string;
  affiliateId?: string | null;
  irevConfig?: any;
}

export default function SmarticoPage() {
  const [data, setData] = useState<SmarticoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Default dates: current month
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
      const response = await fetch(`/api/smartico?date_from=${dateFrom}&date_to=${dateTo}`);
      const result = await response.json();
      if (result.error) throw new Error(result.error);
      
      let resData = result.data || [];
      
      // Filtrar apenas campanhas que:
      // 1. Possuem '#' E números no nome (afiliados Smartico específicos)
      // 2. Têm atividade real (FTD, Reg, PL, CPA ou Depósitos > 0)
      resData = resData.filter((item: SmarticoData) => {
        const campaignName = item.campaign_name || '';
        const hasMarker = campaignName.includes('#') && /\d/.test(campaignName);
        const hasActivity = 
          item.registration_count > 0 || 
          item.ftd_count > 0 || 
          (item.qftd_count || 0) > 0 || 
          Math.abs(item.deposit_total || 0) > 0.01 || 
          Math.abs(item.net_pl || 0) > 0.01;
        
        return hasMarker && hasActivity;
      });
      
      setData(resData);
      
      // Extrair marcas únicas
      const brands: string[] = Array.from(new Set(resData.map((d: any) => d.brand_name))).filter(Boolean) as string[];
      setAvailableBrands(brands);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dateFrom, dateTo]);

  const filteredData = selectedBrand === 'Geral' 
    ? data 
    : data.filter(d => d.brand_name === selectedBrand);

  const totals = filteredData.reduce((acc, curr) => ({
    visits: acc.visits + curr.visit_count,
    regs: acc.regs + curr.registration_count,
    ftds: acc.ftds + curr.ftd_count,
    qftds: acc.qftds + (curr.qftd_count || 0),
    depositCount: acc.depositCount + (curr.deposit_count || 0),
    depositValue: acc.depositValue + (curr.deposit_total || 0),
    ngr: acc.ngr + curr.net_pl,
  }), { visits: 0, regs: 0, ftds: 0, qftds: 0, depositCount: 0, depositValue: 0, ngr: 0 });

  // Agrupar dados por dia para a primeira tabela
  const dailyDataMap = filteredData.reduce((acc: any, curr) => {
    const date = new Date(curr.dt).toLocaleDateString('pt-BR');
    if (!acc[date]) {
      acc[date] = { ...curr, date, registration_count: 0, ftd_count: 0, qftd_count: 0, deposit_count: 0, deposit_total: 0, net_pl: 0, visit_count: 0 };
    }
    acc[date].registration_count += curr.registration_count;
    acc[date].ftd_count += curr.ftd_count;
    acc[date].qftd_count += (curr.qftd_count || 0);
    acc[date].deposit_count += (curr.deposit_count || 0);
    acc[date].deposit_total += (curr.deposit_total || 0);
    acc[date].net_pl += curr.net_pl;
    acc[date].visit_count += curr.visit_count;
    return acc;
  }, {});

  const dailyData = Object.values(dailyDataMap).sort((a: any, b: any) => 
    new Date(b.dt).getTime() - new Date(a.dt).getTime()
  );
  // Agrupar por Afiliado (Campanha)
  const sourceDataMap = filteredData.reduce((acc: any, curr) => {
    const brand = curr.brand_name || 'Desconhecido';
    const campaign = curr.campaign_name || 'Direto / Geral';
    const key = selectedBrand === 'Geral' ? `${brand} - ${campaign}` : campaign;
    
    if (!acc[key]) {
      acc[key] = { 
        name: campaign, 
        brand: brand,
        regs: 0, 
        ftds: 0, 
        qftds: 0,
        value: 0, 
        ngr: 0, 
        visits: 0,
        deposit_count: 0,
        affiliateName: curr.affiliateName,
        affiliateId: curr.affiliateId,
        irevConfig: curr.irevConfig
      };
    }
    acc[key].regs += curr.registration_count;
    acc[key].ftds += curr.ftd_count;
    acc[key].qftds += (curr.qftd_count || 0);
    acc[key].value += (curr.deposit_total || 0);
    acc[key].ngr += curr.net_pl;
    acc[key].visits += curr.visit_count;
    acc[key].deposit_count += (curr.deposit_count || 0);
    return acc;
  }, {});

  const sourceData = Object.values(sourceDataMap).sort((a: any, b: any) => b.regs - a.regs);

  // State for manual typing (DD/MM/YYYY)
  const toDisplay = (iso: string) => {
    if (!iso) return '';
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  };

  const toIso = (display: string) => {
    const parts = display.split('/');
    if (parts.length !== 3) return '';
    const [d, m, y] = parts;
    if (!d || !m || !y || y.length < 4) return '';
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  };

  const [dateFromDisplay, setDateFromDisplay] = useState(toDisplay(firstDay));
  const [dateToDisplay, setDateToDisplay] = useState(toDisplay(today));

  const handleDateInput = (value: string, setter: (val: string) => void, isoSetter: (val: string) => void) => {
    // Basic mask: DD/MM/YYYY
    let cleaned = value.replace(/\D/g, '');
    if (cleaned.length > 8) cleaned = cleaned.slice(0, 8);
    
    let formatted = cleaned;
    if (cleaned.length > 2) formatted = cleaned.slice(0, 2) + '/' + cleaned.slice(2);
    if (cleaned.length > 4) formatted = formatted.slice(0, 5) + '/' + cleaned.slice(4);
    
    setter(formatted);
    
    if (cleaned.length === 8) {
      const iso = toIso(formatted);
      if (iso && !isNaN(new Date(iso).getTime())) {
        isoSetter(iso);
      }
    }
  };

  const handlePreset = (preset: 'today' | 'yesterday' | '7days' | 'month') => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    let from = todayStr;
    let to = todayStr;
    
    switch (preset) {
      case 'today': break;
      case 'yesterday':
        const yesterday = new Date();
        yesterday.setDate(now.getDate() - 1);
        from = yesterday.toISOString().split('T')[0];
        to = from;
        break;
      case '7days':
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(now.getDate() - 7);
        from = sevenDaysAgo.toISOString().split('T')[0];
        break;
      case 'month':
        from = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
        break;
    }
    
    setDateFrom(from);
    setDateTo(to);
    setDateFromDisplay(toDisplay(from));
    setDateToDisplay(toDisplay(to));
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
      row.qftds,
      1, // Fixed 1 per user request
      row.value.toFixed(2),
      1, // Fixed 1 per user request
      row.ngr.toFixed(2)
    ]);
    exportToExcel(csvData, headers, `smartico_export_${dateFrom}_to_${dateTo}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 glass rounded-2xl border border-red-500/20 text-center text-white">
        <h2 className="text-xl font-bold text-red-500 mb-2">Erro na Integração</h2>
        <p className="text-white/40 mb-4">{error}</p>
        <button onClick={fetchData} className="px-4 py-2 bg-indigo-500 rounded-lg text-white hover:bg-indigo-600 transition-colors">
          Tentar Novamente
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-white/40 text-sm mb-2 hover:text-white transition-colors cursor-pointer" onClick={() => window.location.href = '/'}>
            <ArrowLeft className="w-4 h-4" /> Voltar ao Dashboard
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white uppercase tracking-wider">Smartico Performance</h1>
          <p className="text-white/40 text-sm italic">Análise de tráfego e conversão em tempo real.</p>
        </div>
        
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {[
              { id: 'today', label: 'Hoje' },
              { id: 'yesterday', label: 'Ontem' },
              { id: '7days', label: '7 Dias' },
              { id: 'month', label: 'Mês' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => handlePreset(p.id as any)}
                className="px-4 py-1.5 rounded-full glass border border-white/5 text-[10px] font-bold uppercase tracking-wider text-white/40 hover:text-white hover:border-white/20 transition-all active:scale-95"
              >
                {p.label}
              </button>
            ))}
            
            <div className="w-px h-6 bg-white/10 mx-1 hidden sm:block" />
            
            <button onClick={fetchData} className="p-2.5 glass rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-all active:scale-95 group">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
            </button>
            <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2.5 glass rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-all active:scale-95 group border border-white/5">
              <Download className="w-4 h-4 group-hover:bounce" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Exportar EXCEL</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-3 p-2 px-4 glass rounded-2xl border border-white/5 shadow-inner">
              <div className="flex flex-col">
                <span className="text-[8px] uppercase text-white/30 font-bold mb-0.5">De</span>
                <input 
                  type="text" 
                  value={dateFromDisplay} 
                  placeholder="DD/MM/YYYY"
                  onChange={(e) => handleDateInput(e.target.value, setDateFromDisplay, setDateFrom)}
                  className="bg-transparent text-white text-xs outline-none cursor-text w-24"
                />
              </div>
              <div className="w-px h-6 bg-white/10 mx-1" />
              <div className="flex flex-col">
                <span className="text-[8px] uppercase text-white/30 font-bold mb-0.5">Até</span>
                <input 
                  type="text" 
                  value={dateToDisplay} 
                  placeholder="DD/MM/YYYY"
                  onChange={(e) => handleDateInput(e.target.value, setDateToDisplay, setDateTo)}
                  className="bg-transparent text-white text-xs outline-none cursor-text w-24"
                />
              </div>
            </div>

            {/* Brand Selector inside actions bar */}
            <div className="flex items-center gap-1.5 p-1 glass rounded-2xl border border-white/5 h-full">
              <button 
                onClick={() => setSelectedBrand('Geral')}
                className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all ${selectedBrand === 'Geral' ? 'bg-indigo-500 text-white' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
              >
                Geral
              </button>
              {availableBrands.map(brand => (
                <button 
                  key={brand}
                  onClick={() => setSelectedBrand(brand)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all ${selectedBrand === brand ? 'bg-indigo-500 text-white' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                >
                  {brand}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          { label: "Registros", value: totals.regs, icon: Users, color: "text-indigo-400" },
          { label: "FTD", value: totals.ftds, icon: Landmark, color: "text-emerald-400" },
          { label: "CPA (QFTD)", value: totals.qftds, icon: Award, color: "text-blue-400" },
          { label: "Depósitos (R$)", value: `R$ ${totals.depositValue.toFixed(2)}`, icon: Wallet, color: "text-emerald-400" },
          { label: "NGR (Net P&L)", value: `R$ ${totals.ngr.toFixed(2)}`, icon: TrendingUp, color: (totals.ngr < 0 ? 'text-red-400' : 'text-emerald-400') },
        ].map((stat, i) => (
          <div key={i} className="glass p-5 rounded-2xl relative overflow-hidden group border border-white/5">
            <div className={`absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity ${stat.color}`}>
              <stat.icon size={36} />
            </div>
            <div className="text-[9px] font-bold uppercase tracking-widest text-white/30 mb-2">{stat.label}</div>
            <div className={`text-lg font-bold tracking-tight ${stat.color}`}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Breakdown por Afiliado */}
        <div className="glass rounded-2xl overflow-hidden border border-white/5 shadow-2xl">
          <div className="p-6 border-b border-white/10 bg-white/2 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2 uppercase tracking-widest text-sm">
              <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
              Desempenho por Afiliado (Campanhas)
            </h2>
          </div>
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/5 text-white/40 uppercase text-[10px] tracking-widest">
                <tr>
                  <th className="p-4 px-6 uppercase text-[10px] text-white/40">Status IREV</th>
                  <th className="p-4 px-6">Nome do Afiliado (Campanha)</th>
                  <th className="p-4 px-6 text-center font-bold text-white/40 uppercase text-[9px]">Afiliado Mapeado</th>
                  <th className="p-4 px-6 text-center">Registros</th>
                  <th className="p-4 px-6 text-center">FTD</th>
                  <th className="p-4 px-6 text-center">CPA (QFTD)</th>
                  <th className="p-4 px-6 text-right">Depósitos (R$)</th>
                  <th className="p-4 px-6 text-right">NGR (Net P&L)</th>
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
                      <div className="font-semibold text-white group-hover:text-indigo-400 transition-colors uppercase text-xs">{source.name}</div>
                      <div className="text-[9px] text-white/20 truncate max-w-[200px]">{source.brand}</div>
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
                    <td className="p-4 px-6 text-center text-emerald-400 font-medium">{source.ftds}</td>
                    <td className="p-4 px-6 text-center text-blue-400 font-medium">{source.qftds}</td>
                    <td className="p-4 px-6 text-right font-medium text-white">R$ {source.value.toFixed(2)}</td>
                    <td className={`p-4 px-6 text-right font-bold ${source.ngr < 0 ? 'text-red-400' : 'text-emerald-400'}`}>R$ {source.ngr.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
