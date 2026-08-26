import React, { useState } from 'react';
import {
  Film,
  Search,
  Filter,
  Grid,
  List,
  Copy,
  Check,
  Play,
  Sparkles,
  BookOpen,
  Users,
  Layers,
  Award,
  Download,
} from 'lucide-react';
import { Project, Creative, CreativeFormat, ContentChannel } from '../types';

interface CreativeLibraryProps {
  project: Project;
  onSelectCreative: (creative: Creative) => void;
  onOpenShotStudio: (creative: Creative) => void;
}

export const CreativeLibrary: React.FC<CreativeLibraryProps> = ({
  project,
  onSelectCreative,
  onOpenShotStudio,
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const creatives = project.creatives || [];

  const filtered = creatives.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.hook.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.tags && c.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())));

    if (filterType === 'winners') return matchesSearch && (c.status === 'WINNER' || c.performance?.views! > 100000);
    if (filterType === 'published') return matchesSearch && c.status === 'PUBLISHED';
    if (filterType === 'authority') return matchesSearch && c.creativeObjective === 'authority_educational';
    if (filterType === 'lead_dm') return matchesSearch && c.creativeObjective === 'indirect_lead_dm';
    if (filterType === 'direct_sale') return matchesSearch && c.creativeObjective === 'direct_sale_cta';
    if (filterType === 'ai_ugc') return matchesSearch && c.creativeFormat === 'AI UGC';
    if (filterType === 'carousel') return matchesSearch && c.creativeFormat === 'Carousel';
    return matchesSearch;
  });

  const handleCopyHook = (hook: string, id: string) => {
    navigator.clipboard.writeText(hook);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-[#F27D26]">
              <Film className="w-4 h-4" />
            </span>
            <h1 className="text-xl font-serif italic text-white tracking-tight">
              Creative Library — {project.name}
            </h1>
          </div>
          <p className="text-xs text-white/50 mt-1">
            Visual library and vault of all produced videos, scripts, hooks, shots, carousels, and winning assets.
          </p>
        </div>

        {/* View Mode & Filter */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-white/5 border border-white/10 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md cursor-pointer transition ${
                viewMode === 'grid' ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md cursor-pointer transition ${
                viewMode === 'list' ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white'
              }`}
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Filter & Search Ribbon */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-2xl bg-[#0F0F0F] border border-white/10">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-white/40" />
          <input
            type="text"
            placeholder="Search library assets by hook, code, tag, topic..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black/60 border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-white/30 focus:outline-hidden focus:border-[#F27D26]"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto">
          {[
            { id: 'all', label: 'Todos' },
            { id: 'winners', label: '🏆 Winners' },
            { id: 'authority', label: '📚 Autoridade' },
            { id: 'lead_dm', label: '💬 Lead via DM' },
            { id: 'direct_sale', label: '🛒 Venda Direta' },
            { id: 'published', label: 'Publicados' },
            { id: 'ai_ugc', label: 'AI UGC' },
            { id: 'carousel', label: 'Carrosséis' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterType(f.id)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider whitespace-nowrap transition cursor-pointer ${
                filterType === f.id
                  ? 'bg-white text-black font-bold shadow-sm'
                  : 'bg-black/40 border border-white/10 text-white/50 hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid View */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((creative) => {
            const character = project.characters?.find((c) => c.id === creative.characterId);
            const isWinner = creative.status === 'WINNER';

            return (
              <div
                key={creative.id}
                onClick={() => onSelectCreative(creative)}
                className={`p-4 rounded-2xl border transition cursor-pointer space-y-3 flex flex-col justify-between group ${
                  isWinner
                    ? 'bg-[#141414] border-[#F27D26]/70 shadow-lg ring-1 ring-[#F27D26]/20'
                    : 'bg-[#0F0F0F] border-white/10 hover:border-white/20'
                }`}
              >
                <div className="space-y-2.5">
                  {/* Top Badges */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-white/50">{creative.code}</span>
                    <div className="flex items-center gap-1.5">
                      {creative.creativeObjective === 'authority_educational' && (
                        <span className="text-[9px] font-mono font-medium px-2 py-0.5 rounded border border-blue-500/30 bg-blue-500/10 text-blue-400">
                          📚 Autoridade
                        </span>
                      )}
                      {creative.creativeObjective === 'indirect_lead_dm' && (
                        <span className="text-[9px] font-mono font-medium px-2 py-0.5 rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                          💬 Lead DM
                        </span>
                      )}
                      {creative.creativeObjective === 'direct_sale_cta' && (
                        <span className="text-[9px] font-mono font-medium px-2 py-0.5 rounded border border-[#F27D26]/40 bg-[#F27D26]/10 text-[#F27D26]">
                          🛒 Venda Direta
                        </span>
                      )}
                      {isWinner && (
                        <span className="text-[9px] uppercase tracking-wider bg-[#F27D26] text-black font-bold px-2 py-0.5 rounded flex items-center gap-1">
                          <Award className="w-3 h-3" />
                          Winner
                        </span>
                      )}
                      <span className="text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-white/5 border border-white/10 text-white/70">
                        {creative.channel}
                      </span>
                    </div>
                  </div>

                  {/* Thumbnail / Anchor Frame */}
                  <div className="relative rounded-xl overflow-hidden aspect-[16/9] bg-black border border-white/10 flex items-center justify-center">
                    <img
                      src={
                        creative.previewImageUrl ||
                        character?.referenceImageUrl ||
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80'
                      }
                      alt={creative.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

                    <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[11px] text-white">
                      <span className="font-mono bg-black/70 backdrop-blur-md px-2 py-0.5 rounded text-[10px] text-white/80 border border-white/10">
                        {creative.shots?.length || 0} Shots
                      </span>
                      {creative.performance && (
                        <span className="text-[#F27D26] font-mono font-bold text-xs">
                          {(creative.performance.views / 1000).toFixed(1)}k views
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className="text-xs font-bold text-white line-clamp-2 group-hover:text-[#F27D26] transition">
                    {creative.title}
                  </h3>

                  {creative.hook && (
                    <div className="p-2.5 rounded-xl bg-black/60 border border-white/5 text-xs text-white/70 italic line-clamp-2">
                      "{creative.hook}"
                    </div>
                  )}
                </div>

                {/* Bottom Actions */}
                <div
                  className="flex items-center justify-between pt-2 border-t border-white/10"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => handleCopyHook(creative.hook || creative.title, creative.id)}
                    className="flex items-center gap-1 text-[11px] text-white/50 hover:text-white transition cursor-pointer"
                    title="Copy Hook Text"
                  >
                    {copiedId === creative.id ? (
                      <Check className="w-3.5 h-3.5 text-[#F27D26]" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedId === creative.id ? 'Copied' : 'Copy Hook'}</span>
                  </button>

                  <button
                    onClick={() => onOpenShotStudio(creative)}
                    className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-[#F27D26] hover:text-white px-3 py-1 rounded-lg bg-white/5 border border-white/10 transition cursor-pointer"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Open Shots</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="space-y-2">
          {filtered.map((creative) => (
            <div
              key={creative.id}
              onClick={() => onSelectCreative(creative)}
              className="p-4 rounded-2xl bg-[#0F0F0F] border border-white/10 hover:border-white/20 transition cursor-pointer flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="font-mono text-xs font-bold text-white/40 shrink-0">
                  {creative.code}
                </span>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-white truncate">{creative.title}</h4>
                  <p className="text-[11px] text-white/50 truncate">"{creative.hook}"</p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 text-xs">
                <span className="text-white/50">{creative.channel}</span>
                <span className="px-2 py-0.5 rounded bg-white/10 text-white/80 border border-white/10 font-mono text-[10px]">
                  {creative.creativeFormat}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenShotStudio(creative);
                  }}
                  className="px-3 py-1 rounded-lg bg-white hover:bg-neutral-200 text-black text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  Edit Shots
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
