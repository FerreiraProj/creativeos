import React, { useState } from 'react';
import {
  X,
  Clapperboard,
  Sparkles,
  Play,
  Copy,
  Check,
  Award,
  TrendingUp,
  Share2,
  Calendar,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { Project, Creative, CreativePipelineStatus } from '../types';

interface CreativeDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  creative: Creative | null;
  project: Project;
  onOpenShotStudio: (creative: Creative) => void;
  onUpdateCreative: (updated: Creative) => void;
}

export const CreativeDetailModal: React.FC<CreativeDetailModalProps> = ({
  isOpen,
  onClose,
  creative,
  project,
  onOpenShotStudio,
  onUpdateCreative,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !creative) return null;

  const character = project.characters?.find((c) => c.id === creative.characterId);
  const isWinner = creative.status === 'WINNER';

  const handleCopyScript = () => {
    const text = `Title: ${creative.title}\nHook: ${creative.hook}\n\n${creative.scriptBody}\n\nCTA: ${creative.cta}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStatusChange = (newStatus: CreativePipelineStatus) => {
    onUpdateCreative({
      ...creative,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleObjectiveChange = (newObjective: any) => {
    onUpdateCreative({
      ...creative,
      creativeObjective: newObjective || undefined,
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl text-neutral-100 overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-[#F27D26]">
              {creative.code}
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-white/5 border border-white/10 text-white/70">
                {creative.channel}
              </span>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-white/10 text-white border border-white/15">
                {creative.creativeFormat}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white p-1 rounded-lg hover:bg-white/5 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          <div>
            <h2 className="text-xl font-serif italic text-white">{creative.title}</h2>
            {character && (
              <span className="text-xs text-white/50 mt-0.5 block">
                Anchor Character: <strong className="text-white">{character.name}</strong> ({character.role})
              </span>
            )}
          </div>

          {/* Status & Quick Action Ribbon */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between p-4 rounded-xl bg-[#0F0F0F] border border-white/10 gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-widest opacity-40 font-bold text-white">Status:</span>
                <select
                  value={creative.status}
                  onChange={(e) => handleStatusChange(e.target.value as any)}
                  className="bg-black/60 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white font-medium focus:outline-hidden focus:border-[#F27D26]"
                >
                  <option value="IDEA">IDEA</option>
                  <option value="SCRIPT">SCRIPT</option>
                  <option value="REVIEW">REVIEW</option>
                  <option value="APPROVED">APPROVED</option>
                  <option value="PRODUCTION">PRODUCTION</option>
                  <option value="EDITING">EDITING</option>
                  <option value="READY">READY</option>
                  <option value="PUBLISHED">PUBLISHED</option>
                  <option value="WINNER">🏆 WINNER</option>
                  <option value="FAILED">FAILED</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-widest opacity-40 font-bold text-white">Objetivo:</span>
                <select
                  value={creative.creativeObjective || 'direct_sale_cta'}
                  onChange={(e) => handleObjectiveChange(e.target.value)}
                  className="bg-black/60 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white font-medium focus:outline-hidden focus:border-[#F27D26]"
                >
                  <option value="authority_educational">📚 Autoridade (Sem Venda)</option>
                  <option value="indirect_lead_dm">💬 Venda Indireta (DM)</option>
                  <option value="direct_sale_cta">🛒 Venda Direta</option>
                </select>
              </div>
            </div>

            <button
              onClick={() => {
                onClose();
                onOpenShotStudio(creative);
              }}
              className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-white hover:bg-neutral-200 text-black font-bold uppercase tracking-wider text-xs transition cursor-pointer shadow-sm shrink-0"
            >
              <Clapperboard className="w-3.5 h-3.5 text-[#F27D26]" />
              <span>Shot Studio</span>
            </button>
          </div>

          {/* Hook Callout */}
          {creative.hook && (
            <div className="p-4 rounded-xl bg-[#0F0F0F] border border-[#F27D26]/30 space-y-1">
              <span className="text-[10px] font-bold text-[#F27D26] uppercase tracking-widest block">
                Validated 0-3s Hook:
              </span>
              <p className="text-xs text-white/90 italic leading-relaxed">"{creative.hook}"</p>
            </div>
          )}

          {/* Shots Timeline Summary */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-widest opacity-40 font-bold text-white">
                Shot Sequence ({creative.shots?.length || 0} Shots)
              </span>
              <button
                onClick={handleCopyScript}
                className="flex items-center gap-1 text-xs text-white/50 hover:text-white transition cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-[#F27D26]" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy Full Script'}</span>
              </button>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {creative.shots?.map((shot) => (
                <div
                  key={shot.id}
                  className="p-3.5 rounded-xl bg-[#0F0F0F] border border-white/10 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[#F27D26] font-bold">
                      Shot #{shot.shotNumber} ({shot.type})
                    </span>
                    <span className="text-white/40 font-mono text-[10px]">~{shot.durationSec}s</span>
                  </div>
                  <p className="text-white/70">"{shot.spokenText}"</p>
                </div>
              ))}
            </div>
          </div>

          {/* Performance Data if published */}
          {creative.performance && (
            <div className="p-4 rounded-xl bg-[#0F0F0F] border border-white/10 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#F27D26] block">
                Recorded Live Performance
              </span>
              <div className="grid grid-cols-4 gap-2 text-xs font-mono">
                <div className="p-2.5 rounded-lg bg-black/60 border border-white/5">
                  <span className="text-white/40 text-[10px] uppercase block">Views</span>
                  <span className="font-bold text-white">
                    {creative.performance.views.toLocaleString()}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-black/60 border border-white/5">
                  <span className="text-white/40 text-[10px] uppercase block">3s Retention</span>
                  <span className="font-bold text-[#F27D26]">
                    {creative.performance.retentionRatePct}%
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-black/60 border border-white/5">
                  <span className="text-white/40 text-[10px] uppercase block">Saves</span>
                  <span className="font-bold text-white/90">
                    {creative.performance.saves?.toLocaleString() || '0'}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-black/60 border border-white/5">
                  <span className="text-white/40 text-[10px] uppercase block">ROAS</span>
                  <span className="font-bold text-white">{creative.performance.roas || 0}x</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
