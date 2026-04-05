import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "IREV Integration Monitor",
  description: "Monitor de integração de afiliados para IREV",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.className} min-h-screen antialiased`}>
        <div className="flex min-h-screen">
          {/* Sidebar */}
          <aside className="w-64 border-r border-white/5 bg-black/20 p-6 flex flex-col gap-8">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-indigo-500 shadow-lg shadow-indigo-500/20" />
              <span className="text-xl font-bold tracking-tight text-white">IREV Bridge</span>
            </div>
            <nav className="flex flex-col gap-1.5 flex-1">
              <a href="/" className="px-4 py-3 rounded-xl bg-white/5 text-sm font-bold text-white hover:bg-white/10 transition-all border border-white/5">DASHBOARD</a>
              
              <div className="mt-4 mb-2 px-4 text-[10px] font-black uppercase tracking-[0.2em] text-white/30 italic">Operação IREV</div>
              <a href="/irev-diff" className="px-4 py-3 rounded-xl bg-blue-600/20 text-blue-400 text-sm font-black hover:bg-blue-600/30 transition-all border border-blue-500/20 flex items-center justify-between group">
                DIFERENÇA HOJE IREV
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse group-hover:scale-150 transition-transform" />
              </a>
              
              <div className="mt-6 mb-2 px-4 text-[10px] font-black uppercase tracking-[0.2em] text-white/30 italic">Integrações</div>
              <div className="grid grid-cols-1 gap-1">
                {[
                  { name: "Blaze", href: "/blaze" },
                  { name: "BetMGM/Stake", href: "/betmgm" },
                  { name: "Smartico", href: "/smartico" },
                  { name: "Oddsscanner", href: "/oddsscanner" },
                  { name: "Novibet", href: "/novibet" },
                  { name: "Sportingbet", href: "/sportingbet" }
                ].map((item) => (
                  <a key={item.name} href={item.href} className="px-4 py-2.5 rounded-xl text-xs font-bold text-white/50 hover:text-white hover:bg-white/5 transition-all flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-white/10" />
                    {item.name}
                  </a>
                ))}
              </div>

              <div className="mt-auto pt-6 border-t border-white/5">
                <a href="/config/affiliates" className="px-4 py-3 rounded-xl text-xs font-bold text-white/40 hover:text-white hover:bg-white/5 transition-all flex items-center gap-3">
                  CONFIGURAR MAPA
                </a>
                <a href="/config/settings" className="px-4 py-3 rounded-xl text-xs font-bold text-indigo-400 hover:text-white hover:bg-indigo-500/10 transition-all flex items-center gap-3 border border-indigo-500/10 mt-1">
                  GESTÃO DE CHAVES
                </a>
              </div>
            </nav>
            <div className="mt-auto pt-6 border-t border-white/5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-indigo-500/20 ring-1 ring-indigo-500/30" />
                <div>
                  <div className="text-sm font-medium text-white">Admin</div>
                  <div className="text-xs text-white/40">Status: Online</div>
                </div>
              </div>
            </div>
          </aside>
          
          {/* Main Content */}
          <main className="flex-1 p-8 overflow-y-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
