'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { decryptSecret } from '@/lib/crypto';

export default function SecretRevealPage() {
  const params = useParams();
  const secretId = params.id as string;

  const [keyBase64, setKeyBase64] = useState<string | null>(null);
  const [decryptedText, setDecryptedText] = useState<string | null>(null);
  const [burned, setBurned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

  useEffect(() => {
    // 1. Extração segura da chave exclusivamente do fragmento '#'
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace(/^#/, '');
      if (hash) {
        setKeyBase64(hash);
      } else {
        setError('Chave de decifragem ausente no fragmento da URL (#). O link fornecido é incompleto ou inválido.');
      }
    }
  }, []);

  const handleRevealAndBurn = async () => {
    if (!keyBase64) return;
    setLoading(true);
    setError(null);

    try {
      // 2. Chamada atômica ao backend (o servidor queima na hora com GETDEL)
      const res = await fetch(`${apiUrl}/api/secrets/${secretId}`);

      if (res.status === 404) {
        setBurned(true);
        setError('Este segredo já foi lido e incinerado da memória, ou seu tempo limite expirou.');
        return;
      }

      if (!res.ok) {
        throw new Error('Falha ao resgatar segredo do servidor.');
      }

      const data = await res.json();

      // 3. Decifragem local no navegador utilizando a chave da URL
      const plaintext = await decryptSecret(data.encryptedPayload, data.iv, keyBase64);
      setDecryptedText(plaintext);
      setBurned(true); // Confirmação visual de que o dado foi destruído no servidor
    } catch (err: any) {
      setError(err.message || 'Erro durante a decifragem do segredo.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!decryptedText) return;
    navigator.clipboard.writeText(decryptedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="w-full max-w-2xl my-auto py-8">
      <div className="bg-[#0f172a]/70 border border-slate-800 rounded-2xl p-6 md:p-8 backdrop-blur shadow-2xl shadow-black/60 relative overflow-hidden">
        
        {/* Glow effect */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex items-center justify-between mb-5">
          <span className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Resgate de Segredo Efêmero
          </span>
          <span className="text-xs font-mono text-slate-500">ID: {secretId.substring(0, 8)}...</span>
        </div>

        {/* Warning Ribbon */}
        {!decryptedText && !error && (
          <div className="mb-6 p-4 rounded-xl bg-amber-950/20 border border-amber-900/40 text-xs font-mono text-amber-300 flex items-start gap-3">
            <span className="text-lg">🔥</span>
            <div>
              <p className="font-semibold mb-1">Aviso de Destruição Atômica (Burn-after-reading):</p>
              <p className="text-amber-300/80 leading-relaxed">
                Ao clicar em revelar, o servidor purgará imediatamente este segredo da memória RAM (operação atômica). Ele nunca mais poderá ser lido por ninguém.
              </p>
            </div>
          </div>
        )}

        {/* Decrypted Payload View */}
        {decryptedText && (
          <div className="space-y-4">
            <div className="p-3 bg-emerald-950/20 border border-emerald-800/40 rounded-xl text-xs font-mono text-emerald-400 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Segredo Decifrado Localmente com Sucesso
              </span>
              <span className="text-slate-400">🔥 Incinerado do Servidor</span>
            </div>

            <div className="relative">
              <textarea
                rows={7}
                readOnly
                value={decryptedText}
                className="w-full bg-[#070b13] border border-slate-800 rounded-xl p-4 font-mono text-sm text-emerald-300 focus:outline-none resize-none"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={copyToClipboard}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs font-mono rounded-lg transition"
              >
                {copied ? 'Copiado para Área de Transferência!' : 'Copiar Conteúdo'}
              </button>

              <a
                href="/"
                className="text-xs font-mono text-slate-400 hover:text-white underline"
              >
                Criar um Novo DeadDrop
              </a>
            </div>
          </div>
        )}

        {/* Error or Already Burned State */}
        {error && (
          <div className="p-5 bg-red-950/30 border border-red-900/50 rounded-xl text-center space-y-3">
            <div className="text-3xl">🪦</div>
            <h2 className="text-sm font-semibold font-mono text-red-400">Segredo Inacessível</h2>
            <p className="text-xs font-mono text-slate-400 max-w-md mx-auto leading-relaxed">{error}</p>
            <div className="pt-2">
              <a
                href="/"
                className="inline-block px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-mono rounded-lg transition"
              >
                Voltar ao Início
              </a>
            </div>
          </div>
        )}

        {/* Action Button */}
        {!decryptedText && !error && (
          <button
            type="button"
            onClick={handleRevealAndBurn}
            disabled={loading || !keyBase64}
            className="w-full mt-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold py-3.5 px-4 rounded-xl transition duration-200 flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-[0.99] font-mono text-sm"
          >
            {loading ? (
              <span>Resgatando e Incinerando Segredo...</span>
            ) : (
              <>
                <span>Revelar e Queimar Segredo</span>
                <span>&rarr;</span>
              </>
            )}
          </button>
        )}

      </div>
    </main>
  );
}
