import React, { useState } from 'react';
import {
  FolderKanban,
  Plus,
  Search,
  Filter,
  ArrowRight,
  Sparkles,
  Clapperboard,
  CheckCircle2,
  TrendingUp,
  XCircle,
  Eye,
  MoreVertical,
  Play,
  Film,
  Instagram,
  Video,
} from 'lucide-react';
import { Project, Creative, CreativePipelineStatus, ContentChannel, CreativeFormat } from '../types';

interface CreativePipelineKanbanProps {
  project: Project;
  onSelectCreative: (creative: Creative) => void;
  onOpenShotStudio: (creative: Creative) => void;
  onNewCreative: () => void;
  onUpdateCreativeStatus: (creativeId: string, newStatus: CreativePipelineStatus) => void;
}

const STAGES: { id: CreativePipelineStatus; label: string; color: string; group: string }[] = [
  { id: 'IDEA', label: 'Ideas', color: 'border-zinc-700 bg-zinc-900/40 text-zinc-300', group: 'Planning' },
  { id: 'SCRIPT', label: 'Scripts', color: 'border-blue-900 bg-blue-950/30 text-blue-300', group: 'Planning' },
  { id: 'REVIEW', label: 'Review', color: 'border-amber-900 bg-amber-950/30 text-amber-300', group: 'Planning' },
  { id: 'APPROVED', label: 'Approved', color: 'border-emerald-900 bg-emerald-950/30 text-emerald-300', group: 'Production' },
  { id: 'PRODUCTION', label: 'In Production', color: 'border-purple-900 bg-purple-950/30 text-purple-300', group: 'Production' },
  { id: 'EDITING', label: 'Editing', color: 'border-indigo-900 bg-indigo-950/30 text-indigo-300', group: 'Production' },
  { id: 'READY', label: 'Ready', color: 'border-cyan-900 bg-cyan-950/30 text-cyan-300', group: 'Distribution' },
  { id: 'PUBLISHED', label: 'Published', color: 'border-sky-900 bg-sky-950/30 text-sky-300', group: 'Distribution' },
  { id: 'WINNER', label: '🏆 Winners', color: 'border-emerald-500 bg-emerald-950/50 text-emerald-300', group: 'Performance' },
  { id: 'FAILED', label: 'Failed', color: 'border-rose-900 bg-rose-950/30 text-rose-300', group: 'Performance' },
];

export const CreativePipelineKanban: React.FC<CreativePipelineKanbanProps> = ({
  project,
  onSelectCreative,
  onOpenShotStudio,
  onNewCreative,
  onUpdateCreativeStatus,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChannel, setSelectedChannel] = useState<string>('all');
  const [selectedFormat, setSelectedFormat] = useState<string>('all');
  const [selectedObjective, setSelectedObjective] = useState<string>('all');
  const [activeGroupFilter, setActiveGroupFilter] = useState<string>('all');

  const creatives = project.creatives || [];

  // Counts map
  const stageCounts = STAGES.reduce((acc, stage) => {
    acc[stage.id] = creatives.filter((c) => c.status === stage.id).length;
    return acc;
  }, {} as Record<CreativePipelineStatus, number>);

  const filteredCreatives = creatives.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.hook.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.tags && c.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())));
    const matchesChannel = selectedChannel === 'all' || c.channel === selectedChannel;
    const matchesFormat = selectedFormat === 'all' || c.creativeFormat === selectedFormat;
    const matchesObjective = selectedObjective === 'all' || c.creativeObjective === selectedObjective;
    return matchesSearch && matchesChannel && matchesFormat && matchesObjective;
  });

  const getNextStage = (current: CreativePipelineStatus): CreativePipelineStatus | null => {
    const order: CreativePipelineStatus[] = [
      'IDEA',
      'SCRIPT',
      'REVIEW',
      'APPROVED',
      'PRODUCTION',
      'EDITING',
      'READY',
      'PUBLISHED',
      'WINNER',
    ];
    const idx = order.indexOf(current);
    if (idx >= 0 && idx < order.length - 1) {
      return order[idx + 1];
    }
    return null;
  };

  const getPrevStage = (current: CreativePipelineStatus): CreativePipelineStatus | null => {
    const order: CreativePipelineStatus[] = [
      'IDEA',
      'SCRIPT',
      'REVIEW',
      'APPROVED',
      'PRODUCTION',
      'EDITING',
      'READY',
      'PUBLISHED',
    ];
    const idx = order.indexOf(current);
    if (idx > 0) {
      return order[idx - 1];
    }
    return null;
  };

  return (
    <div className="space-y-5">
      {/* Header & Metric Ribbon */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-[#F27D26]">
              <FolderKanban className="w-4 h-4" />
            </span>
            <h1 className="text-xl font-serif italic text-white tracking-tight">
              Active Creative Pipeline
            </h1>
          </div>
          <p className="text-xs text-white/50 mt-1">
            End-to-end multi-shot production workflow from raw hook idea to validated winner.
          </p>
        </div>

        <button
          onClick={onNewCreative}
          className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-neutral-200 text-black font-bold text-xs uppercase tracking-wider rounded-lg transition shadow-sm cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5 stroke-[3]" />
          <span>New Creative</span>
        </button>
      </div>

      {/* Summary Stat Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <span className="text-[10px] uppercase tracking-widest opacity-40 block mb-1">
            Ideas & Scripts
          </span>
          <span className="text-2xl font-serif italic text-white block">
            {(stageCounts['IDEA'] || 0) + (stageCounts['SCRIPT'] || 0)}
          </span>
        </div>
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <span className="text-[10px] uppercase tracking-widest opacity-40 block mb-1">
            Approved
          </span>
          <span className="text-2xl font-serif italic text-white block">
            {stageCounts['APPROVED'] || 0}
          </span>
        </div>
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <span className="text-[10px] uppercase tracking-widest opacity-40 block mb-1">
            In Production
          </span>
          <span className="text-2xl font-serif italic text-white block">
            {(stageCounts['PRODUCTION'] || 0) + (stageCounts['EDITING'] || 0)}
          </span>
        </div>
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <span className="text-[10px] uppercase tracking-widest opacity-40 block mb-1">
            Ready to Post
          </span>
          <span className="text-2xl font-serif italic text-white block">
            {stageCounts['READY'] || 0}
          </span>
        </div>
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <span className="text-[10px] uppercase tracking-widest opacity-40 block mb-1">
            Published
          </span>
          <span className="text-2xl font-serif italic text-white block">
            {stageCounts['PUBLISHED'] || 0}
          </span>
        </div>
        <div className="p-4 rounded-xl bg-white/5 border border-white/10 border-l-2 border-l-[#F27D26]">
          <span className="text-[10px] uppercase tracking-widest text-[#F27D26] font-bold block mb-1">
            🏆 Winners
          </span>
          <span className="text-2xl font-serif italic text-[#F27D26] block">
            {stageCounts['WINNER'] || 0}
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-white/[0.02] border border-white/10">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-white/40" />
          <input
            type="text"
            placeholder="Search creatives by title, #code, hook, tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black/60 border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-white/40 focus:outline-hidden focus:border-[#F27D26]"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          <select
            value={selectedChannel}
            onChange={(e) => setSelectedChannel(e.target.value)}
            className="bg-black/60 border border-white/10 text-xs text-white/80 rounded-lg px-3 py-1.5 focus:outline-hidden focus:border-[#F27D26]"
          >
            <option value="all">All Channels</option>
            <option value="Instagram">Instagram</option>
            <option value="TikTok">TikTok</option>
            <option value="YouTube">YouTube</option>
            <option value="Paid Ads">Paid Ads</option>
          </select>

          <select
            value={selectedFormat}
            onChange={(e) => setSelectedFormat(e.target.value)}
            className="bg-black/60 border border-white/10 text-xs text-white/80 rounded-lg px-3 py-1.5 focus:outline-hidden focus:border-[#F27D26]"
          >
            <option value="all">All Formats</option>
            <option value="AI UGC">AI UGC</option>
            <option value="Cinematic">Cinematic</option>
            <option value="Product Video">Product Video</option>
            <option value="Faceless">Faceless</option>
            <option value="Carousel">Carousel</option>
          </select>

          <select
            value={selectedObjective}
            onChange={(e) => setSelectedObjective(e.target.value)}
            className="bg-black/60 border border-white/10 text-xs text-white/80 rounded-lg px-3 py-1.5 focus:outline-hidden focus:border-[#F27D26]"
          >
            <option value="all">Todos os Objetivos</option>
            <option value="authority_educational">📚 Autoridade / Didático</option>
            <option value="indirect_lead_dm">💬 Venda Indireta (DM)</option>
            <option value="direct_sale_cta">🛒 Venda Direta</option>
          </select>
        </div>
      </div>

      {/* Kanban Board Horizontal Scroll Columns */}
      <div className="overflow-x-auto pb-4 pt-1">
        <div className="flex gap-3 min-w-[1500px]">
          {STAGES.map((stage) => {
            const stageCreatives = filteredCreatives.filter((c) => c.status === stage.id);
            const isWinnerCol = stage.id === 'WINNER';
            return (
              <div
                key={stage.id}
                className={`w-72 shrink-0 bg-white/[0.02] border ${
                  isWinnerCol ? 'border-[#F27D26]/30' : 'border-white/10'
                } rounded-2xl flex flex-col max-h-[720px]`}
              >
                {/* Column Header */}
                <div className="p-3.5 border-b border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-white">
                      {stage.label}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-white/60">
                      {stageCreatives.length}
                    </span>
                  </div>
                  {stage.id === 'IDEA' && (
                    <button
                      onClick={onNewCreative}
                      className="p-1 rounded text-white/40 hover:text-white hover:bg-white/10 transition"
                      title="Quick Idea"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Column Cards */}
                <div className="p-3 space-y-3 overflow-y-auto flex-1">
                  {stageCreatives.length === 0 ? (
                    <div className="text-center py-8 border border-dashed border-white/10 rounded-xl">
                      <span className="text-[10px] uppercase tracking-widest text-white/30">Empty</span>
                    </div>
                  ) : (
                    stageCreatives.map((creative) => {
                      const nextStage = getNextStage(creative.status);
                      const prevStage = getPrevStage(creative.status);
                      const character = project.characters?.find((ch) => ch.id === creative.characterId);
                      const isCreativeWinner = creative.status === 'WINNER';

                      return (
                        <div
                          key={creative.id}
                          onClick={() => onSelectCreative(creative)}
                          className={`p-3.5 rounded-xl bg-[#0F0F0F] border ${
                            isCreativeWinner ? 'border-[#F27D26]/40' : 'border-white/10'
                          } hover:border-white/20 transition shadow-sm group cursor-pointer space-y-2.5`}
                        >
                          {/* Card Top: Code & Format */}
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-mono text-[#F27D26] font-semibold text-xs">
                              {creative.code}
                            </span>
                            <div className="flex items-center gap-1">
                              <span className="text-[9px] uppercase tracking-wider font-medium px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-white/70">
                                {creative.channel}
                              </span>
                              <span className="text-[9px] uppercase tracking-wider font-medium px-1.5 py-0.5 rounded bg-white/10 text-white/90">
                                {creative.creativeFormat}
                              </span>
                            </div>
                          </div>

                          {/* Objective Badge */}
                          {creative.creativeObjective && (
                            <div className="flex items-center">
                              {creative.creativeObjective === 'authority_educational' && (
                                <span className="text-[9px] font-mono font-medium px-2 py-0.5 rounded border border-blue-500/30 bg-blue-500/10 text-blue-400">
                                  📚 Autoridade (Sem Venda)
                                </span>
                              )}
                              {creative.creativeObjective === 'indirect_lead_dm' && (
                                <span className="text-[9px] font-mono font-medium px-2 py-0.5 rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                                  💬 Lead via DM
                                </span>
                              )}
                              {creative.creativeObjective === 'direct_sale_cta' && (
                                <span className="text-[9px] font-mono font-medium px-2 py-0.5 rounded border border-[#F27D26]/40 bg-[#F27D26]/10 text-[#F27D26]">
                                  🛒 Venda Direta
                                </span>
                              )}
                            </div>
                          )}

                          {/* Title */}
                          <h4 className="text-xs font-bold text-white line-clamp-2 group-hover:text-[#F27D26] transition">
                            {creative.title}
                          </h4>

                          {/* Hook preview */}
                          {creative.hook && (
                            <p className="text-[11px] text-white/60 line-clamp-2 italic bg-black/40 p-2 rounded-lg border border-white/5">
                              "{creative.hook}"
                            </p>
                          )}

                          {/* Meta: Shots count & Character */}
                          <div className="flex items-center justify-between text-[10px] text-white/40 pt-1 border-t border-white/5">
                            <div className="flex items-center gap-1.5">
                              {character && (
                                <span className="text-white/80 font-medium flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#F27D26]" />
                                  {character.name}
                                </span>
                              )}
                              <span>{creative.shots?.length || 0} shots</span>
                            </div>

                            {creative.performance && (
                              <span className="text-[#F27D26] font-mono font-medium">
                                {(creative.performance.views / 1000).toFixed(1)}k views
                              </span>
                            )}
                          </div>

                          {/* Card Actions */}
                          <div
                            className="flex items-center justify-between pt-1 gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() => onOpenShotStudio(creative)}
                              className="flex items-center gap-1 text-[10px] font-medium text-white/80 hover:text-white px-2 py-1 rounded bg-white/5 hover:bg-white/10 border border-white/10 transition"
                            >
                              <Clapperboard className="w-3 h-3 text-[#F27D26]" />
                              <span>Shot Studio</span>
                            </button>

                            <div className="flex items-center gap-1">
                              {prevStage && (
                                <button
                                  title={`Move to ${prevStage}`}
                                  onClick={() => onUpdateCreativeStatus(creative.id, prevStage)}
                                  className="text-[10px] p-1 rounded bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/10"
                                >
                                  ←
                                </button>
                              )}
                              {nextStage && (
                                <button
                                  title={`Advance to ${nextStage}`}
                                  onClick={() => onUpdateCreativeStatus(creative.id, nextStage)}
                                  className="text-[10px] p-1 rounded bg-[#F27D26]/20 hover:bg-[#F27D26]/30 text-[#F27D26] border border-[#F27D26]/30"
                                >
                                  →
                                </button>
                              )}
                              {creative.status === 'PUBLISHED' && (
                                <button
                                  title="Mark as Winner"
                                  onClick={() => onUpdateCreativeStatus(creative.id, 'WINNER')}
                                  className="text-[10px] px-1.5 py-0.5 rounded bg-[#F27D26] text-black font-bold"
                                >
                                  🏆
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
