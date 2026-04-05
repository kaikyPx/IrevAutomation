'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, RefreshCw, TrendingUp, Users, Wallet, Landmark, Award, ShieldCheck, ShieldAlert } from 'lucide-react';

interface OddsScannerData {
  brand: string;
  source: string;
  affiliateName?: string;
  affiliateId?: string;
  irevConfig?: any;
  registrations: number;
  ftds: number;
  cpa: number;
  deposits: number;
  ngr: number;
  currency: string;
}

export default function OddsScannerPage() {
  const [data, setData] = useState<OddsScannerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Período atual do mês conforme visto na Novibet
  const today = new Date().toISOString().split('T')[0];
  const firstDay = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`;

  const [dateFrom, setDateFrom] = useState(firstDay);
  const [dateTo, setDateTo] = useState(today);
  
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [availableSources, setAvailableSources] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [availableBrands, setAvailableBrands] = useState<string[]>([]);
  const [isSourceDropdownOpen, setIsSourceDropdownOpen] = useState(false);
  const [isBrandDropdownOpen, setIsBrandDropdownOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/oddsscanner-teste?date_from=${dateFrom}&date_to=${dateTo}`);
      const result = await response.json();
      if (result.error) throw new Error(result.error);
      
      let resData = result.data || [];
      
      // FILTRO DESATIVADO TEMPORARIAMENTE PARA DEBUG (MOSTRAR TUDO)
      /*
      resData = resData.filter((item: OddsScannerData) => {
        const source = item.source || '';
        const hasMarker = source.includes('#') && /\d/.test(source);
        const hasActivity = 
          item.registrations > 0 || 
          item.ftds > 0 || 
          (item.cpa || 0) > 0 || 
          Math.abs(item.deposits || 0) > 0.01 || 
          Math.abs(item.ngr || 0) > 0.01;
        
        return hasMarker && hasActivity;
      });
      */
      
      setData(resData);
      
      // Extrair todas as fontes de tráfego únicas (afiliados)
      const sources: string[] = Array.from(new Set(resData.map((d: any) => d.source))).filter(Boolean) as string[];
      setAvailableSources(sources.sort());

      // Extrair todas as marcas únicas (Casas de Apostas)
      const brands: string[] = Array.from(new Set(resData.map((d: any) => d.brand))).filter(Boolean) as string[];
      setAvailableBrands(brands.sort());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dateFrom, dateTo]);

  const filteredData = data.filter(d => {
    const sourceMatch = selectedSources.length === 0 || selectedSources.includes(d.source);
    const brandMatch = selectedBrands.length === 0 || selectedBrands.includes(d.brand);
    return sourceMatch && brandMatch;
  });

  const totals = filteredData.reduce((acc, curr) => ({
    regs: acc.regs + curr.registrations,
    ftds: acc.ftds + curr.ftds,
    cpa: acc.cpa + curr.cpa,
    deposits: acc.deposits + curr.deposits,
    ngr: acc.ngr + curr.ngr,
    currency: curr.currency || acc.currency
  }), { regs: 0, ftds: 0, cpa: 0, deposits: 0, ngr: 0, currency: 'EUR' });

  // Funções helper para formatação de data
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

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <RefreshCw className="w-8 h-8 text-orange-500 animate-spin" />
    </div>
  );

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 pb-6 border-b border-white/5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-white/40 text-sm mb-2 hover:text-white transition-colors cursor-pointer" onClick={() => window.location.href = '/'}>
            <ArrowLeft className="w-4 h-4" /> Voltar ao Dashboard
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white uppercase tracking-wider">OddsScanner <span className="text-orange-500">TESTE MAPA</span></h1>
          <p className="text-white/40 text-sm italic font-medium">Versão de teste para novo mapeamento e cálculos.</p>
        </div>
        
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="flex items-center gap-3 p-2 px-4 glass rounded-2xl border border-white/5">
            <div className="flex flex-col"><span className="text-[8px] uppercase text-white/30 font-bold">De</span><input type="text" value={dateFromDisplay} onChange={(e) => handleDateInput(e.target.value, setDateFromDisplay, setDateFrom)} className="bg-transparent text-white text-xs outline-none w-24" /></div>
            <div className="w-px h-6 bg-white/10 mx-1" /><div className="flex flex-col"><span className="text-[8px] uppercase text-white/30 font-bold">Até</span><input type="text" value={dateToDisplay} onChange={(e) => handleDateInput(e.target.value, setDateToDisplay, setDateTo)} className="bg-transparent text-white text-xs outline-none w-24" /></div>
          </div>
          <button onClick={fetchData} className="p-3 bg-orange-600 hover:bg-orange-500 text-white rounded-xl shadow-lg transition-all active:scale-95 group"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform'}`} /></button>
        </div>
      </div>

      {/* Dual Filters: Traffic Source & Brands */}
      <div className="flex flex-col gap-4 relative z-[200]">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          
          {/* Traffic Source Multi-Selector */}
          {availableSources.length > 0 && (
            <div className="relative z-[100]">
              <div className="flex flex-col md:flex-row items-center gap-4 p-2 glass rounded-2xl border border-white/10 bg-white/[0.02] h-full">
                <div className="px-4 text-[9px] font-black uppercase tracking-widest text-orange-500 border-r border-white/10 mr-2 flex items-center gap-2 shrink-0">
                  Filtrar por Fonte 
                </div>
                
                <div className="relative flex-1 w-full md:w-auto">
                  <button 
                    onClick={() => { setIsSourceDropdownOpen(!isSourceDropdownOpen); setIsBrandDropdownOpen(false); }}
                    className="w-full flex items-center justify-between px-4 py-2.5 glass border border-white/10 rounded-xl text-xs text-white/70 hover:text-white transition-all shadow-lg"
                  >
                    <div className="truncate text-left max-w-[250px]">
                      {selectedSources.length === 0 ? "Todas as Fontes" : selectedSources.join(', ')}
                    </div>
                    <TrendingUp size={14} className={`transform transition-transform ${isSourceDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isSourceDropdownOpen && (
                    <div className="absolute left-0 mt-2 w-full md:w-[450px] max-h-[400px] overflow-y-auto bg-slate-950 border border-white/20 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] z-[999] p-3 animate-in fade-in zoom-in duration-200">
                      <div className="flex items-center justify-between p-3 mb-3 border-b border-white/10">
                        <button onClick={(e) => { e.stopPropagation(); setSelectedSources([]); }} className="text-[10px] font-black uppercase tracking-widest text-orange-500 hover:text-orange-400">Limpar Fontes</button>
                        <button onClick={(e) => { e.stopPropagation(); setIsSourceDropdownOpen(false); }} className="text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white">Fechar</button>
                      </div>
                      <div className="grid grid-cols-1 gap-1.5">
                        {availableSources.map(source => {
                          const isSelected = selectedSources.includes(source);
                          return (
                            <button
                              key={source}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (isSelected) setSelectedSources(selectedSources.filter(s => s !== source));
                                else setSelectedSources([...selectedSources, source]);
                              }}
                              className={`flex items-center justify-between px-4 py-3 rounded-xl text-xs transition-all text-left ${isSelected ? 'bg-orange-600 text-white font-bold' : 'text-white/60 hover:bg-white/10 hover:text-white'}`}
                            >
                              <span className="truncate pr-4">{source}</span>
                              {isSelected && <ShieldCheck size={16} />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Brand/House Multi-Selector */}
          {availableBrands.length > 0 && (
            <div className="relative z-50">
              <div className="flex flex-col md:flex-row items-center gap-4 p-2 glass rounded-2xl border border-white/10 bg-white/[0.02] h-full">
                <div className="px-4 text-[9px] font-black uppercase tracking-widest text-blue-500 border-r border-white/10 mr-2 flex items-center gap-2 shrink-0">
                  Filtrar por Casa
                </div>
                
                <div className="relative flex-1 w-full md:w-auto">
                  <button 
                    onClick={() => { setIsBrandDropdownOpen(!isBrandDropdownOpen); setIsSourceDropdownOpen(false); }}
                    className="w-full flex items-center justify-between px-4 py-2.5 glass border border-white/10 rounded-xl text-xs text-white/70 hover:text-white transition-all shadow-lg"
                  >
                    <div className="truncate text-left max-w-[250px]">
                      {selectedBrands.length === 0 ? "Todas as Casas" : selectedBrands.join(', ')}
                    </div>
                    <TrendingUp size={14} className={`transform transition-transform ${isBrandDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isBrandDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-full md:w-[450px] max-h-[400px] overflow-y-auto bg-slate-950 border border-white/20 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] z-[999] p-3 animate-in fade-in zoom-in duration-200">
                      <div className="flex items-center justify-between p-3 mb-3 border-b border-white/10">
                        <button onClick={(e) => { e.stopPropagation(); setSelectedBrands([]); }} className="text-[10px] font-black uppercase tracking-widest text-blue-500 hover:text-blue-400">Limpar Casas</button>
                        <button onClick={(e) => { e.stopPropagation(); setIsBrandDropdownOpen(false); }} className="text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white">Fechar</button>
                      </div>
                      <div className="grid grid-cols-1 gap-1.5">
                        {availableBrands.map(brand => {
                          const isSelected = selectedBrands.includes(brand);
                          return (
                            <button
                              key={brand}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (isSelected) setSelectedBrands(selectedBrands.filter(b => b !== brand));
                                else setSelectedBrands([...selectedBrands, brand]);
                              }}
                              className={`flex items-center justify-between px-4 py-3 rounded-xl text-xs transition-all text-left ${isSelected ? 'bg-blue-600 text-white font-bold' : 'text-white/60 hover:bg-white/10 hover:text-white'}`}
                            >
                              <span className="truncate pr-4">{brand}</span>
                              {isSelected && <ShieldCheck size={16} />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Display selected tags for both filters */}
        <div className="flex flex-wrap gap-2 px-2">
            {selectedSources.map(s => (
                <span key={s} className="bg-orange-600/20 text-orange-400 text-[9px] font-bold px-2 py-1 rounded-lg border border-orange-500/20 flex items-center gap-1">
                    {s}
                    <button onClick={() => setSelectedSources(selectedSources.filter(item => item !== s))} className="hover:text-white">×</button>
                </span>
            ))}
            {selectedBrands.map(b => (
                <span key={b} className="bg-blue-600/20 text-blue-400 text-[9px] font-bold px-2 py-1 rounded-lg border border-blue-500/20 flex items-center gap-1">
                    {b}
                    <button onClick={() => setSelectedBrands(selectedBrands.filter(item => item !== b))} className="hover:text-white">×</button>
                </span>
            ))}
        </div>
      </div>

      {error && <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center">{error}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          { label: "Registros", value: totals.regs, icon: Users, color: "text-orange-400" },
          { label: "FTD", value: totals.ftds, icon: Landmark, color: "text-emerald-400" },
          { label: "CPA Processados", value: totals.cpa, icon: Award, color: "text-yellow-400" },
          { label: `Depósitos (${totals.currency})`, value: `${totals.currency === 'EUR' ? '€' :totals.currency === 'BRL' ? 'R$' : '$'} ${totals.deposits.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: Wallet, color: "text-blue-400" },
          { label: `NGR (${totals.currency})`, value: `${totals.currency === 'EUR' ? '€' : totals.currency === 'BRL' ? 'R$' : '$'} ${totals.ngr.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: TrendingUp, color: (totals.ngr < 0 ? 'text-red-400' : 'text-emerald-400') },
        ].map((stat, i) => (
          <div key={i} className="glass p-5 rounded-2xl relative overflow-hidden group border border-white/5">
            <div className={`absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity ${stat.color}`}><stat.icon size={36} /></div>
            <div className="text-[9px] font-bold uppercase tracking-widest text-white/30 mb-2">{stat.label}</div>
            <div className={`text-lg font-bold tracking-tight ${stat.color}`}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="glass rounded-2xl overflow-hidden border border-white/5 shadow-2xl">
        <div className="p-6 border-b border-white/10 bg-white/2"><h2 className="text-lg font-semibold text-white uppercase tracking-widest text-sm text-orange-400">Detalhamento por Traffic Source (OddsScanner)</h2></div>
        <div className="w-full overflow-x-auto text-sm">
          <table className="w-full text-left">
            <thead className="bg-white/5 text-white/40 uppercase text-[10px] tracking-widest">
              <tr>
                <th className="p-4 px-6 uppercase text-[10px] text-white/40">Status IREV</th>
                <th className="p-4 px-6">Fonte de Tráfego</th>
                <th className="p-4 px-6 text-center font-bold text-white/40 uppercase text-[9px]">Vendedor Mapeado</th>
                <th className="p-4 px-6 text-center">Registros</th>
                <th className="p-4 px-6 text-center">FTD</th>
                <th className="p-4 px-6 text-center">CPA</th>
                <th className="p-4 px-6 text-right">Depósitos ({totals.currency})</th>
                <th className="p-4 px-6 text-right">NGR ({totals.currency})</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-white/70">
              {filteredData.map((row: any, i) => (
                <tr key={i} className={`hover:bg-white/5 transition-colors ${!row.affiliateId ? 'bg-red-500/5 opacity-80' : ''}`}>
                  <td className="p-4 px-6 text-center">
                    {row.irevConfig?.irev_enabled ? (
                      <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[8px] font-bold uppercase ring-1 ring-emerald-500/20"><ShieldCheck className="w-3 h-3" /> Sync</div>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-red-500/10 text-red-400 text-[8px] font-bold uppercase ring-1 ring-red-500/20"><ShieldAlert className="w-3 h-3" /> No Sync</div>
                    )}
                  </td>
                  <td className="p-4 px-6">
                    <div className="font-semibold text-white uppercase text-xs">{row.source}</div>
                    <div className="text-[9px] text-white/40 text-xs italic">{row.brand}</div>
                  </td>
                  <td className="p-4 px-6 text-center">
                    {row.affiliateId ? (
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] text-white font-bold bg-white/5 px-2 py-0.5 rounded-lg border border-white/10 uppercase">{row.affiliateName}</span>
                        <span className="text-[8px] text-indigo-400 font-bold mt-1">ID IREV: {row.irevConfig?.id_oferta || 'N/A'}</span>
                      </div>
                    ) : (
                      <span className="text-[9px] text-red-400/60 font-medium italic">Vincule em Configurações</span>
                    )}
                  </td>
                  <td className="p-4 px-6 text-center font-bold text-orange-400">{row.registrations}</td>
                  <td className="p-4 px-6 text-center text-emerald-400">{row.ftds}</td>
                  <td className="p-4 px-6 text-center text-yellow-400">{row.cpa}</td>
                  <td className="p-4 px-6 text-right text-blue-400 font-medium">{row.currency === 'BRL' ? 'R$' : '$'} {row.deposits.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  <td className={`p-4 px-6 text-right font-bold ${row.ngr < 0 ? 'text-red-400' : 'text-emerald-400'}`}>{row.currency === 'BRL' ? 'R$' : '$'} {row.ngr.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
