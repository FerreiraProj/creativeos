import React, { useEffect, useState } from 'react';
import {
  Zap,
  X,
  Key,
  Cpu,
  Coins,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  Server,
  Layers,
} from 'lucide-react';
import { AiGatewayConfig } from '../types';

interface AiGatewayModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AiGatewayConfig;
  onSaveConfig: (updated: AiGatewayConfig) => void;
}

export const AiGatewayModal: React.FC<AiGatewayModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
}) => {
  const [localConfig, setLocalConfig] = useState<AiGatewayConfig>(config);
  const [isSaved, setIsSaved] = useState(false);

  // Re-sync from the saved config each time the modal opens (also coerces a stale/disabled
  // videoModel selection back to the one live engine — see the "Coming soon" options below).
  useEffect(() => {
    if (isOpen) {
      const isDisabledVideoModel = ['fal-ai-omni', 'kling-v1-5', 'fal-wan'].includes(config.videoModel);
      setLocalConfig(isDisabledVideoModel ? { ...config, videoModel: 'gemini-omni' } : config);
    }
  }, [isOpen, config]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig(localConfig);
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl w-full max-w-xl shadow-2xl text-neutral-100 overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-[#F27D26]">
              <Zap className="w-4 h-4" />
            </span>
            <div>
              <h2 className="text-lg font-serif italic text-white">AI Gateway & BYOK Keys</h2>
              <p className="text-xs text-white/50 mt-0.5">
                Model provider abstraction and personal API key management.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white p-1 rounded-lg hover:bg-white/5 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Active Model Routing */}
          <div className="space-y-3">
            <span className="text-[10px] uppercase tracking-widest opacity-40 font-bold text-white flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-[#F27D26]" />
              <span>Roteamento de Modelos de Inteligência Artificial</span>
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] uppercase tracking-widest opacity-40 font-bold block mb-1">
                  Motor de Texto & Guiões (LLM)
                </label>
                <select
                  value={localConfig.textModel}
                  onChange={(e) => setLocalConfig({ ...localConfig, textModel: e.target.value })}
                  className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-hidden focus:border-[#F27D26]"
                >
                  <option value="gemini-3.6-flash">Google Gemini 3.6 Flash (Recomendado / Ultra-rápido)</option>
                  <option value="gemini-2.5-pro">Google Gemini 2.5 Pro (Estratégia Profunda)</option>
                  <option value="gpt-4o">OpenAI GPT-4o (Geração via OpenAI)</option>
                  <option value="gpt-4o-mini">OpenAI GPT-4o Mini (Económico)</option>
                  <option value="claude-3-5-sonnet">Anthropic Claude 3.5 Sonnet</option>
                </select>
                <span className="text-[10px] text-white/40 block mt-1">
                  Usado para criar ideias, ganchos, quebra em shots e diálogos.
                </span>
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-widest opacity-40 font-bold block mb-1">
                  Motor de Vídeo & Renderização UGC
                </label>
                <select
                  value={localConfig.videoModel}
                  onChange={(e) => setLocalConfig({ ...localConfig, videoModel: e.target.value })}
                  className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-hidden focus:border-[#F27D26]"
                >
                  <option value="gemini-omni">Gemini Omni Flash — Reference-to-Video (Fal.ai, Live)</option>
                  <option value="fal-ai-omni" disabled>Fal.ai Omni UGC Character Sync (Coming soon)</option>
                  <option value="kling-v1-5" disabled>Fal.ai Kling 1.5 Cinematic (Coming soon)</option>
                  <option value="fal-wan" disabled>Fal.ai Wan 2.1 Video Model (Coming soon)</option>
                </select>
                <span className="text-[10px] text-white/40 block mt-1">
                  Usado para gerar o vídeo real de cada shot (foto da personagem + fala sincronizada).
                </span>
              </div>
            </div>
          </div>

          {/* BYOK (Bring Your Own Key) */}
          <div className="space-y-3 pt-3 border-t border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-widest opacity-40 font-bold text-white flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-[#F27D26]" />
                <span>Chaves de API (BYOK - Bring Your Own Key)</span>
              </span>
              <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                🔒 Armazenamento Seguro
              </span>
            </div>

            <div className="space-y-3">
              {/* Gemini */}
              <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <span>Google Gemini API Key</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/30">
                      Texto & Guiões
                    </span>
                  </label>
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] text-[#F27D26] hover:underline"
                  >
                    Obter Chave Gemini ↗
                  </a>
                </div>
                <input
                  type="password"
                  placeholder="Configurada automaticamente no servidor (ou cola a tua chave AIza...)"
                  value={localConfig.byokKeys?.geminiApiKey || ''}
                  onChange={(e) =>
                    setLocalConfig({
                      ...localConfig,
                      byokKeys: { ...localConfig.byokKeys, geminiApiKey: e.target.value },
                    })
                  }
                  className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-xs text-white font-mono placeholder-white/30 focus:outline-hidden focus:border-[#F27D26]"
                />
                <p className="text-[10px] text-white/40">
                  Gera todos os guiões, retenção, memórias criativas e análise de performance.
                </p>
              </div>

              {/* OpenAI */}
              <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <span>OpenAI API Key</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/30">
                      Alternativa para Texto
                    </span>
                  </label>
                  <a
                    href="https://platform.openai.com/api-keys"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] text-[#F27D26] hover:underline"
                  >
                    Obter Chave OpenAI ↗
                  </a>
                </div>
                <input
                  type="password"
                  placeholder="sk-proj-..."
                  value={localConfig.byokKeys?.openaiApiKey || ''}
                  onChange={(e) =>
                    setLocalConfig({
                      ...localConfig,
                      byokKeys: { ...localConfig.byokKeys, openaiApiKey: e.target.value },
                    })
                  }
                  className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-xs text-white font-mono placeholder-white/30 focus:outline-hidden focus:border-[#F27D26]"
                />
                <p className="text-[10px] text-white/40">
                  Insere a tua chave da OpenAI caso seleciones o modelo GPT-4o para escrever os guiões.
                </p>
              </div>

              {/* Fal.ai */}
              <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <span>Fal.ai API Key</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      Criação de Vídeos & Imagens
                    </span>
                  </label>
                  <a
                    href="https://fal.ai/dashboard/keys"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] text-[#F27D26] hover:underline"
                  >
                    Obter Chave Fal.ai ↗
                  </a>
                </div>
                <input
                  type="password"
                  placeholder="fal_key_..."
                  value={localConfig.byokKeys?.falApiKey || ''}
                  onChange={(e) =>
                    setLocalConfig({
                      ...localConfig,
                      byokKeys: { ...localConfig.byokKeys, falApiKey: e.target.value },
                    })
                  }
                  className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-xs text-white font-mono placeholder-white/30 focus:outline-hidden focus:border-[#F27D26]"
                />
                <p className="text-[10px] text-white/40">
                  Necessária para renderizar os clips de vídeo UGC e imagens com a consistência do Character Vault.
                </p>
              </div>
            </div>
          </div>

          {/* Credit Estimator & Future SaaS Architecture */}
          <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-2">
            <span className="text-[10px] font-bold text-[#F27D26] uppercase tracking-widest flex items-center gap-1.5">
              <Coins className="w-3.5 h-3.5" />
              <span>Credit Consumption Architecture</span>
            </span>
            <div className="grid grid-cols-3 gap-2 text-[11px] text-white/50">
              <div className="p-2.5 rounded-lg bg-[#0F0F0F] border border-white/5">
                <span className="font-bold text-white block">1 Credit</span>
                <span>Idea & Hook Gen</span>
              </div>
              <div className="p-2.5 rounded-lg bg-[#0F0F0F] border border-white/5">
                <span className="font-bold text-white block">3 Credits</span>
                <span>Multi-Shot Script</span>
              </div>
              <div className="p-2.5 rounded-lg bg-[#0F0F0F] border border-white/5">
                <span className="font-bold text-white block">5 Credits</span>
                <span>Video Shot Render</span>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-white/10 text-xs font-bold uppercase tracking-wider text-white/60 hover:text-white transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-white hover:bg-neutral-200 text-black text-xs font-bold uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              {isSaved ? <CheckCircle className="w-4 h-4 text-[#F27D26]" /> : null}
              <span>{isSaved ? 'Settings Saved' : 'Save Configuration'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
