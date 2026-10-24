import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'DeadDrop — Compartilhamento Seguro e Efêmero',
  description: 'Plataforma distribuída Zero-Knowledge para troca de segredos com queima atômica após leitura.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="min-h-screen flex flex-col items-center justify-between p-4 selection:bg-emerald-500/30 selection:text-emerald-300">
        {/* Header */}
        <header className="w-full max-w-3xl flex items-center justify-between py-6 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-mono font-bold text-lg">
              &gt;_
            </div>
            <div>
              <h1 className="text-base font-semibold tracking-tight text-white flex items-center gap-2">
                DeadDrop <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-400 font-mono">v0.2.0</span>
              </h1>
              <p className="text-xs text-slate-400">Zero-Knowledge & Burn-After-Reading</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-400/90 bg-emerald-950/40 border border-emerald-800/50 px-3 py-1.5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            AES-256-GCM Client-Side
          </div>
        </header>

        {/* Content */}
        {children}

        {/* Footer */}
        <footer className="w-full max-w-3xl py-4 border-t border-slate-800/80 text-center text-xs font-mono text-slate-500">
          ENIAC 2026 • Distributed & Secure Solutions • Nicholas Santos Pereira
        </footer>
      </body>
    </html>
  );
}
