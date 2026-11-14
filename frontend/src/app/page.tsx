'use client';

import { useState } from 'react';
import { encryptSecret } from '@/lib/crypto';

export default function HomePage() {
  const [plaintext, setPlaintext] = useState('');
  const [ttl, setTtl] = useState(86400); // 24 hours default
  const [loading, setLoading] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

  const handleCreateDeadDrop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plaintext.trim()) return;

    setLoading(true);
    setError(null);
    setGeneratedLink(null);

    try {
      // 1. Cifragem local 100% no cliente
      const { ciphertext, iv, keyBase64 } = await encryptSecret(plaintext);

      // 2. Envio da carga indecifrável para a API Spring Boot
      const res = await fetch(`${apiUrl}/api/secrets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          encryptedPayload: ciphertext,
          iv: iv,
          ttlSeconds: ttl,
        }),
      });

      if (!res.ok) {
        throw new Error('Falha ao comunicar com o servidor.');
      }

      const data = await res.json();
      const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
      
      // 3. Montagem do link com chave estritamente no hash (#)
      const secretUrl = `${origin}/secret/${data.id}#${keyBase64}`;
      setGeneratedLink(secretUrl);
      setPlaintext(''); // Limpa o texto da memória da tela
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao criar DeadDrop.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!generatedLink) return;
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="w-full max-w-2xl my-auto py-8">
      <div className="bg-[#0f172a]/70 border border-slate-800 rounded-2xl p-6 md:p-8 backdrop-blur shadow-2xl shadow-black/60 relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex items-center justify-between mb-4">
          <label className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Carga Secreta (Mensagem, .env ou Chaves)
          </label>
          <span className="text-xs font-mono text-slate-500">Cifrado no navegador antes do envio</span>
        </div>

        <form onSubmit={handleCreateDeadDrop}>
          <div className="relative">
            <textarea
              rows={6}
              value={plaintext}
              onChange={(e) => setPlaintext(e.target.value)}
              placeholder="// Cole aqui sua chave de API, variáveis de ambiente ou texto confidencial...&#10;DATABASE_URL=postgres://user:super_secret@cluster:5432/prod"
              className="w-full bg-[#070b13] border border-slate-800 rounded-xl p-4 font-mono text-sm text-emerald-300 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all resize-none"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
            <div>
              <label className="block text-xs font-mono uppercase text-slate-400 mb-1.5">Destruição Automática</label>
              <select
                value={ttl}
                onChange={(e) => setTtl(Number(e.target.value))}
                className="w-full bg-[#070b13] border border-slate-800 text-xs font-mono text-slate-300 rounded-lg p-2.5 focus:outline-none focus:border-emerald-500/50"
              >
                <option value={3600}>1 hora após o envio (ou 1ª leitura)</option>
                <option value={86400}>24 horas após o envio (ou 1ª leitura)</option>
                <option value={604800}>7 dias após o envio (ou 1ª leitura)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-slate-400 mb-1.5">Arquitetura Zero-Knowledge</label>
              <div className="w-full bg-[#070b13]/50 border border-slate-800/80 text-xs font-mono text-slate-400 rounded-lg p-2.5 flex items-center gap-1.5">
                <span className="text-emerald-400 font-bold">✓</span> Chave gerada no cliente (URL Hash)
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-950/30 border border-red-900/50 rounded-lg text-xs font-mono text-red-400">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !plaintext.trim()}
            className="w-full mt-6 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-semibold py-3 px-4 rounded-xl transition duration-200 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-[0.99]"
          >
            {loading ? (
              <span className="font-mono text-xs">Cifrando localmente e gerando segredo...</span>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Cifrar e Gerar DeadDrop</span>
              </>
            )}
          </button>
        </form>

        {/* Link Output Section */}
        {generatedLink && (
          <div className="mt-6 pt-5 border-t border-slate-800/80">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
              <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                Link Criado com Sucesso:
              </span>
              <span className="text-amber-400 flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Chave (#) nunca trafega na rede
              </span>
            </div>

            <div className="flex items-center gap-2 bg-[#070b13] border border-slate-800/80 rounded-xl p-2.5">
              <input
                type="text"
                readOnly
                value={generatedLink}
                className="bg-transparent text-xs font-mono text-emerald-400 w-full focus:outline-none select-all"
              />
              <button
                type="button"
                onClick={copyToClipboard}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-mono text-white rounded-lg flex items-center gap-1 shrink-0"
              >
                {copied ? 'Copiado!' : 'Copiar'}
              </button>
            </div>

            <div className="mt-3 flex justify-end">
              <a
                href={generatedLink}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-mono text-slate-400 hover:text-emerald-400 underline flex items-center gap-1"
              >
                Abrir link e testar incineração &rarr;
              </a>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
