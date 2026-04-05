import { ArrowRight, Activity, Zap, ShieldCheck, Layers, ArrowUpRight } from "lucide-react";

export default function Home() {
  const casas = [
    { name: "Blaze (CellXpert)", status: "Ativo", color: "text-red-400", href: "/blaze" },
    { name: "BetMGM/Stake (NetRefer)", status: "Ativo", color: "text-blue-400", href: "/betmgm" },
    { name: "Smartico (EstrelaBet/MultiBet)", status: "Ativo", color: "text-emerald-400", href: "/smartico" },
    { name: "Sportingbet (Entain)", status: "Ativo", color: "text-amber-400", href: "/sportingbet" },
    { name: "Novibet (RavenTrack)", status: "Ativo", color: "text-indigo-400", href: "/novibet" },
    { name: "OddsScanner", status: "Ativo", color: "text-orange-400", href: "/oddsscanner" },
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* Header e Boas-vindas */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-5xl font-black tracking-tighter text-white">Dashboard <span className="text-blue-500 italic block md:inline">Express</span></h1>
          <p className="text-white/40 text-lg font-medium">Controle total das integrações e sincronização IREV.</p>
        </div>
        <div className="bg-white/5 px-6 py-3 rounded-2xl border border-white/5 flex items-center gap-4">
            <div className="flex flex-col items-end">
                <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Status Operacional</span>
                <span className="text-sm font-bold text-emerald-400">TODOS SISTEMAS ONLINE</span>
            </div>
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
        </div>
      </div>

      {/* Destaque Principal: IREV DIFF */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <a 
          href="/irev-diff" 
          className="lg:col-span-2 group relative overflow-hidden glass p-10 rounded-[2.5rem] border border-blue-500/20 shadow-[0_0_50px_rgba(59,130,246,0.1)] transition-all hover:scale-[1.01] active:scale-[0.98]"
        >
          <div className="relative z-10 flex flex-col h-full justify-between gap-12">
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-500 rounded-xl">
                        <Zap className="w-5 h-5 text-white fill-white" />
                    </div>
                    <span className="text-xs font-black uppercase tracking-[0.3em] text-blue-400">Ferramenta Prioritária</span>
                </div>
                <h2 className="text-4xl font-black tracking-tighter text-white leading-none">DIFERENÇA HOJE <span className="text-blue-500 italic">IREV</span></h2>
                <p className="text-white/40 max-w-md font-medium">Visualize os lançamentos exatos de hoje comparando o acumulado de ontem com o de hoje diretamente do banco de dados.</p>
            </div>
            <div className="flex items-center gap-4 text-blue-400 font-black tracking-widest uppercase text-sm">
                ABRIR MATRIX DELTA <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
            </div>
          </div>
          
          {/* Background Decor */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-blue-600/10 blur-[100px] rounded-full" />
          <div className="absolute bottom-0 left-0 ml-10 mb-10 text-white/[0.02] font-black text-9xl select-none">DELTA</div>
        </a>

        <div className="flex flex-col gap-6">
            <div className="glass p-8 rounded-[2.5rem] border border-white/5 flex-1 flex flex-col justify-center gap-4">
                <div className="flex items-center gap-3 text-emerald-400">
                    <ShieldCheck className="w-6 h-6" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Sincronização Ativa</span>
                </div>
                <div>
                    <div className="text-4xl font-black text-white tracking-tighter">100%</div>
                    <p className="text-white/20 text-xs font-bold uppercase tracking-wider mt-1">Confiabilidade de Dados</p>
                </div>
            </div>
            <div className="glass p-8 rounded-[2.5rem] border border-white/5 flex-1 flex flex-col justify-center gap-4">
                <div className="flex items-center gap-3 text-orange-400">
                    <Activity className="w-6 h-6" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Status da Rede</span>
                </div>
                <div>
                    <div className="text-4xl font-black text-white tracking-tighter">LATENCY LOW</div>
                    <p className="text-white/20 text-xs font-bold uppercase tracking-wider mt-1">APIs Respondendo 200 OK</p>
                </div>
            </div>
        </div>
      </div>

      {/* Lista de Conexões Refatorada */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-4">
          <h2 className="text-xl font-black tracking-tight text-white uppercase italic tracking-widest">Estado das Fontes</h2>
          <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Total: {casas.length} Integradas</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {casas.map((casa, i) => (
            <a 
              key={i} 
              href={casa.href}
              className="group glass p-6 rounded-3xl border border-white/5 hover:bg-white/[0.03] transition-all flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className={`w-3 h-3 rounded-full ${casa.status === 'Ativo' ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-red-500'} transition-all group-hover:scale-125`} />
                <div className="flex flex-col">
                    <span className="text-sm font-black text-white/90 group-hover:text-white transition-colors uppercase tracking-tight">{casa.name}</span>
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${casa.color} opacity-60`}>{casa.status}</span>
                </div>
              </div>
              <ArrowUpRight className="w-5 h-5 text-white/10 group-hover:text-white transition-all transform group-hover:translate-x-1 group-hover:-translate-y-1" />
            </a>
          ))}
        </div>
      </div>

      <div className="pt-10 text-center">
         <p className="text-[10px] font-bold text-white/10 uppercase tracking-[0.5em]">Global Bridge System © 2026</p>
      </div>
    </div>
  );
}
