'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, RefreshCw, Layers, ClipboardCheck, Filter, LayoutGrid, List, CheckCircle2, AlertCircle } from 'lucide-react';

interface DiffData {
  brand: string;
  platform: string;
  source: string;
  affiliateName: string;
  affiliateId: string;
  irevConfig: any;
  currency: string;
  diffRegs: number;
  diffFtds: number;
  diffCpa: number;
  diffDeposits: number;
  diffNgr: number;
  totalRegs: number;
  isMappedPlaceholder?: boolean;
  audit?: {
    regs: { t: number, y: number },
    ftds: { t: number, y: number },
    cpa: { t: number, y: number },
    deps: { t: number, y: number },
    ngr: { t: number, y: number }
  };
}

interface BrandResponse {
  brand: string;
  platform: string;
  data: DiffData[];
  hasMovement?: boolean;
}

export default function IrevDiffPage() {
  const [brands, setBrands] = useState<BrandResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dates, setDates] = useState<any>(null);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const [selectedBrand, setSelectedBrand] = useState('Geral');
  const [auditItem, setAuditItem] = useState<DiffData | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/irev/diff');
      const result = await response.json();
      if (result.error) throw new Error(result.error);
      setBrands(result.brands || []);
      setDates(result.dates);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const availableBrands = Array.from(new Set(brands.map(b => b.brand))).sort();

  const filteredBrands = brands.filter(b => {
    const matchesBrand = selectedBrand === 'Geral' || b.brand === selectedBrand;
    return matchesBrand;
  }).map(b => ({
    ...b,
    // SELECIONAMOS TUDO QUE É MAPEADO
    data: b.data.filter(d => {
      const isMapped = d.affiliateId !== null;
      const hasMovement = (d.diffRegs > 0 || d.diffFtds > 0 || Math.abs(d.diffNgr || 0) > 0.01 || Math.abs(d.diffDeposits || 0) > 0.01);
      
      // MOSTRAR TUDO QUE É MAPEADO SE UMA MARCA FOR SELECIONADA
      // SE FOR GERAL, MOSTRAR APENAS COMPETENTES COM MOVIMENTO
      if (selectedBrand !== 'Geral') return isMapped;
      return isMapped && hasMovement;
    })
  })).filter(b => b.data.length > 0);

  const totalDiff = filteredBrands.reduce((acc, b) => acc + b.data.reduce((sub, d) => sub + d.diffRegs, 0), 0);
  const totalFtdDiff = filteredBrands.reduce((acc, b) => acc + b.data.reduce((sub, d) => sub + d.diffFtds, 0), 0);
  const totalCpaDiff = filteredBrands.reduce((acc, b) => acc + b.data.reduce((sub, d) => sub + (d.diffCpa || 0), 0), 0);
  const totalDepDiff = filteredBrands.reduce((acc, b) => acc + b.data.reduce((sub, d) => sub + (d.diffDeposits || 0), 0), 0);
  const totalNgrDiff = filteredBrands.reduce((acc, b) => acc + b.data.reduce((sub, d) => sub + d.diffNgr, 0), 0);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopySuccess(id);
    setTimeout(() => setCopySuccess(null), 2000);
  };

  const formatCurrency = (val: number) => {
    // APENAS NÚMEROS COM . PARA DECIMAIS (PADRÃO IREV)
    return Number(val).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      useGrouping: false
    });
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
      <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
      <p className="text-white/40 text-sm font-bold uppercase tracking-widest italic tracking-widest">Sincronizando Matrix Delta...</p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700 pb-20 mt-4 px-4 relative">
      {/* High-Impact Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-6">
        <div className="flex items-center gap-6">
          <button onClick={() => window.location.href = '/'} className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/50 transition-all border border-white/5">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tighter leading-none">Global <span className="text-blue-500 italic">Matrix</span></h1>
            <div className="text-white/20 text-[10px] uppercase font-black tracking-[0.3em] mt-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              IREV MAPPING CONSOLE • DELTA&nbsp;
              <span className="text-blue-500/60">{dates?.label || dates?.today}</span>
            </div>
          </div>
        </div>

        <button onClick={fetchData} className="p-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl transition-all shadow-[0_0_30px_rgba(37,99,235,0.3)] group active:scale-95">
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-bold flex items-center gap-3 animate-bounce">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      {/* Audit Modal Overlay */}
      {auditItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
            <div className="w-full max-w-2xl glass rounded-[2.5rem] border border-white/10 overflow-hidden shadow-[0_0_100px_rgba(37,99,235,0.2)] animate-in zoom-in-95 duration-300">
                <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                    <div>
                        <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-500 mb-2">Auditoria de Cálculos</h3>
                        <p className="text-2xl font-black text-white tracking-tighter uppercase italic">{auditItem.source}</p>
                    </div>
                    <button onClick={() => setAuditItem(null)} className="p-4 rounded-full bg-white/5 hover:bg-white/10 text-white transition-all">
                        <ArrowLeft className="w-5 h-5 rotate-90" />
                    </button>
                </div>

                <div className="p-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                            { label: "Registros", current: auditItem.audit?.regs.t, prev: auditItem.audit?.regs.y, diff: auditItem.diffRegs, color: "text-blue-500" },
                            { label: "FTDs", current: auditItem.audit?.ftds.t, prev: auditItem.audit?.ftds.y, diff: auditItem.diffFtds, color: "text-emerald-500" },
                            { label: "CPAs", current: auditItem.audit?.cpa.t, prev: auditItem.audit?.cpa.y, diff: auditItem.diffCpa, color: "text-yellow-500" },
                            { label: "Deposits", current: auditItem.audit?.deps.t, prev: auditItem.audit?.deps.y, diff: auditItem.diffDeposits, color: "text-sky-400", isCurrency: true },
                            { label: "NGR", current: auditItem.audit?.ngr.t, prev: auditItem.audit?.ngr.y, diff: auditItem.diffNgr, color: auditItem.diffNgr >= 0 ? "text-emerald-500" : "text-red-500", isCurrency: true },
                        ].map((m, i) => (
                            <div key={i} className="flex flex-col bg-white/5 p-5 rounded-3xl border border-white/5">
                                <span className="text-[9px] font-black uppercase tracking-widest text-white/20 mb-3">{m.label}</span>
                                <div className="flex items-baseline justify-between">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-white/40 uppercase mb-1">Mês Hoje</span>
                                        <span className="text-xl font-black text-white tracking-tighter leading-none italic">
                                            {m.isCurrency ? formatCurrency(m.current || 0) : (m.current || 0)}
                                        </span>
                                    </div>
                                    <span className="text-white/20 font-black px-2">-</span>
                                    <div className="flex flex-col text-right">
                                        <span className="text-[10px] font-black text-white/40 uppercase mb-1">Até Ontem</span>
                                        <span className="text-xl font-black text-white/60 tracking-tighter leading-none italic">
                                            {m.isCurrency ? formatCurrency(m.prev || 0) : (m.prev || 0)}
                                        </span>
                                    </div>
                                </div>
                                <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                                    <span className="text-[9px] font-black text-white/10 uppercase tracking-widest italic">DELTA RESULTANTE</span>
                                    <span className={`text-2xl font-black ${m.color} tracking-tighter`}>{m.isCurrency ? formatCurrency(m.diff) : m.diff}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="p-8 pt-0 flex items-center justify-center">
                    <button onClick={() => setAuditItem(null)} className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase tracking-[0.3em] rounded-3xl transition-all shadow-[0_0_50px_rgba(37,99,235,0.3)]">
                        FECHAR AUDITORIA
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* GIANT KPI BAR */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Registros", value: totalDiff, color: "text-blue-500" },
          { label: "FTD Hoje", value: totalFtdDiff, color: "text-emerald-500" },
          { label: "CPA Diário", value: totalCpaDiff, color: "text-yellow-500" },
          { label: "Deposits", value: formatCurrency(totalDepDiff), color: "text-sky-400" },
          { label: "NGR Global", value: formatCurrency(totalNgrDiff), color: totalNgrDiff >= 0 ? "text-emerald-500" : "text-red-500" },
        ].map((kpi, idx) => (
          <div key={idx} className="glass p-6 rounded-3xl border border-white/5 flex flex-col items-center justify-center text-center group hover:border-white/10 transition-all hover:bg-white/[0.02]">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 mb-3 group-hover:text-blue-500/50 transition-colors">{kpi.label}</span>
            <div className={`text-3xl md:text-4xl font-black tracking-tighter ${kpi.color} leading-none`}>{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Optimized Filter Bar - Compact Dropdown */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-3 bg-white/[0.03] rounded-3xl border border-white/5 shadow-2xl backdrop-blur-md">
        <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="flex items-center px-4 py-2 text-[10px] font-black uppercase text-blue-500 tracking-widest border-r border-white/5 h-10">Casas:</div>
            <select 
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="bg-white/5 text-white/80 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl border border-white/10 outline-none focus:border-blue-500/50 transition-all cursor-pointer h-10 min-w-[200px] hover:bg-white/10"
            >
                <option value="Geral" className="bg-[#0a0a0a]">Relatório Geral</option>
                {availableBrands.map(brand => (
                    <option key={brand} value={brand} className="bg-[#0a0a0a]">
                        {brand}
                    </option>
                ))}
            </select>
        </div>
        
        <div className="flex items-center gap-4 px-4 h-10 bg-white/[0.02] rounded-xl border border-white/5">
             <span className="text-[10px] text-white/30 font-black uppercase tracking-[0.2em]">{filteredBrands.length} Marcas com Atividade</span>
        </div>
      </div>

      {/* Clean Matrix View */}
      <div className="space-y-6">
        {filteredBrands.map((brandInfo, bIndex) => (
          <div key={bIndex} className="animate-in slide-in-from-bottom-2 duration-500">
            <div className="glass rounded-[2rem] border border-white/5 overflow-hidden shadow-2xl bg-gradient-to-br from-white/[0.03] to-transparent">
              {/* Internal Brand Header - Compact */}
              <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
                <div className="flex items-center gap-4">
                    <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                    <h2 className="text-xs font-black text-white uppercase tracking-[0.3em] italic">{brandInfo.brand}</h2>
                </div>
                <div className="text-[9px] font-black text-white/10 uppercase tracking-[0.2em] bg-white/5 px-3 py-1 rounded-full">Enviado via {brandInfo.platform}</div>
              </div>

              <div className="w-full overflow-x-auto">
                <table className="w-full text-left border-collapse table-auto text-[11px]">
                  <thead className="bg-white/[0.01] border-b border-white/5 border-dashed">
                    <tr className="text-[9px] uppercase font-black tracking-widest text-white/20">
                      <th className="px-6 py-4 w-[25%]">Afiliado / Fonte</th>
                      <th className="px-6 py-4 text-center">IREV Config</th>
                      <th className="px-6 py-4 text-center">Reg</th>
                      <th className="px-6 py-4 text-center">FTD</th>
                      <th className="px-6 py-4 text-center">CPA</th>
                      <th className="px-6 py-4 text-right">Deposits</th>
                      <th className="px-6 py-4 text-right">NGR (Delta)</th>
                      <th className="px-6 py-4 text-right w-[60px]">Auditoria</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {brandInfo.data.map((row, i) => (
                      <tr key={i} className="group hover:bg-blue-500/[0.02] transition-colors cursor-pointer" onClick={() => setAuditItem(row)}>
                        <td className="px-6 py-5">
                          <div className="flex flex-col">
                            <span className="font-bold text-white group-hover:text-blue-400 transition-colors uppercase tracking-wider">{row.source}</span>
                            <span className="text-[9px] text-white/20 font-black uppercase tracking-widest mt-1 italic">{row.affiliateName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-center">
                            <div className="flex flex-col items-center gap-1">
                                {row.irevConfig ? (
                                    <>
                                        <span className="text-[9px] px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 font-black border border-blue-500/20 tracking-widest uppercase">ID: {row.irevConfig.id_oferta}</span>
                                        <span className="text-[8px] text-white/80 font-mono tracking-tighter group-hover:text-white transition-colors">{row.irevConfig.id_link_oferta}</span>
                                    </>
                                ) : (
                                    <span className="text-[9px] px-2 py-0.5 rounded-md bg-red-500/5 text-red-500/30 font-black border border-red-500/10 tracking-widest uppercase opacity-40">Não Mapeado</span>
                                )}
                            </div>
                        </td>
                        <td className="px-6 py-5 text-center">
                          <span className={`text-xl font-black text-white tracking-tighter group-hover:scale-110 transition-transform inline-block`}>{row.diffRegs}</span>
                        </td>
                        <td className="px-6 py-5 text-center">
                          <span className={`text-xl font-black text-emerald-500 tracking-tighter group-hover:scale-110 transition-transform inline-block`}>{row.diffFtds}</span>
                        </td>
                        <td className="px-6 py-5 text-center">
                          <span className={`text-xl font-black text-yellow-500/80 tracking-tighter group-hover:scale-110 transition-transform inline-block`}>{row.diffCpa || 0}</span>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <span className={`text-sm font-bold text-sky-400 opacity-60 group-hover:opacity-100 transition-opacity`}>
                            {formatCurrency(row.diffDeposits)}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <span className={`text-sm font-black ${row.diffNgr > 0 ? 'text-emerald-500' : row.diffNgr < 0 ? 'text-red-500' : 'text-white/20'}`}>
                            {formatCurrency(row.diffNgr)}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <div 
                            className={`p-3 rounded-xl transition-all border border-transparent text-white/5 hover:text-white hover:bg-white/10 hover:border-white/10`}
                          >
                            <LayoutGrid className="w-4 h-4" />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer Meta */}
      <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-[0.5em] text-white/5 pt-10 px-4 mb-10 border-t border-white/5">
        <span>Matrix Reporting Engine v7.5</span>
        <span>Secure Data Link Enforced</span>
      </div>
    </div>
  );
}
