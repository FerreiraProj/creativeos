import React, { useState } from 'react';
import {
  BrainCircuit,
  TrendingUp,
  Search,
  Sparkles,
  Award,
  Zap,
  ArrowUpRight,
  MessageSquare,
  BarChart3,
  RefreshCw,
  Eye,
  Share2,
  Bookmark,
  CheckCircle2,
  ShieldAlert,
} from 'lucide-react';
import { Project, Creative, CreativeMemoryItem, AiGatewayConfig } from '../types';
import { queryCreativeMemory, runCreativeOptimizer, MemoryQueryResult } from '../lib/api';

interface PerformanceIntelligenceViewProps {
  project: Project;
  aiGatewayConfig?: AiGatewayConfig;
  onSelectCreative: (creative: Creative) => void;
  onUpdateCreativeMemory: (newItem: CreativeMemoryItem) => void;
}

export const PerformanceIntelligenceView: React.FC<PerformanceIntelligenceViewProps> = ({
  project,
  aiGatewayConfig,
  onSelectCreative,
  onUpdateCreativeMemory,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'memory-search' | 'intelligence' | 'metrics'>('memory-search');

  // Memory Search Query state
  const [searchPrompt, setSearchPrompt] = useState('');
  const [isSearchingMemory, setIsSearchingMemory] = useState(false);
  const [memoryQueryResult, setMemoryQueryResult] = useState<MemoryQueryResult | null>(null);

  // Optimizer & Pattern Extractor state
  const [isExtractingPatterns, setIsExtractingPatterns] = useState(false);
  const [optimizationReport, setOptimizationReport] = useState<any>(
    project.insights?.[0] || null
  );

  const creatives = project.creatives || [];
  const memoryItems = project.creativeMemory || [];
  const winnerCreatives = creatives.filter((c) => c.status === 'WINNER');

  // Aggregated metrics
  const totalViews = creatives.reduce((acc, c) => acc + (c.performance?.views || 0), 0);
  const totalSaves = creatives.reduce((acc, c) => acc + (c.performance?.saves || 0), 0);
  const avgRetention =
    creatives.filter((c) => c.performance?.retentionRatePct).length > 0
      ? (
          creatives.reduce((acc, c) => acc + (c.performance?.retentionRatePct || 0), 0) /
          creatives.filter((c) => c.performance?.retentionRatePct).length
        ).toFixed(1)
      : '58.4';

  const handleRunMemoryQuery = async (queryToRun?: string) => {
    const q = queryToRun || searchPrompt;
    if (!q.trim()) return;
    setIsSearchingMemory(true);
    try {
      const result = await queryCreativeMemory({
        query: q,
        brandMemory: project.brandMemory,
        creativeMemory: project.creativeMemory,
        performanceHistory: creatives.map((c) => ({
          code: c.code,
          title: c.title,
          hook: c.hook,
          performance: c.performance,
          isWinner: c.status === 'WINNER',
        })),
        aiGatewayConfig,
      });
      setMemoryQueryResult(result);
    } finally {
      setIsSearchingMemory(false);
    }
  };

  const handleRunOptimizer = async () => {
    setIsExtractingPatterns(true);
    try {
      const report = await runCreativeOptimizer({
        brandMemory: project.brandMemory,
        creatives,
        aiGatewayConfig,
      });
      setOptimizationReport(report);
    } finally {
      setIsExtractingPatterns(false);
    }
  };

  const quickMemoryQueries = [
    'Que conteúdos já criámos sobre cafeína e adenosina?',
    'Que hooks tiveram melhor retenção nos primeiros 3 segundos?',
    'Qual o desempenho da personagem Sofia em vídeos UGC?',
    'Que criativos falharam e o que devemos evitar?',
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-[#F27D26]">
              <BrainCircuit className="w-4 h-4" />
            </span>
            <h1 className="text-xl font-serif italic text-white tracking-tight">
              Creative Intelligence & Memory Engine
            </h1>
          </div>
          <p className="text-xs text-white/50 mt-1">
            Search everything created in <strong>{project.name}</strong>, analyze performance metrics, and learn winning creative patterns so the AI never starts from zero.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRunOptimizer}
            disabled={isExtractingPatterns}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white hover:bg-neutral-200 text-black font-bold uppercase tracking-wider text-xs transition shadow-sm cursor-pointer disabled:opacity-50"
          >
            {isExtractingPatterns ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#F27D26]" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-[#F27D26]" />
            )}
            <span>Extract Patterns</span>
          </button>
        </div>
      </div>

      {/* Aggregate KPI Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-[#0F0F0F] border border-white/10">
          <div className="flex items-center justify-between text-white/40 text-xs">
            <span className="text-[10px] uppercase tracking-widest opacity-60 font-bold">Total Views</span>
            <Eye className="w-3.5 h-3.5 text-[#F27D26]" />
          </div>
          <span className="text-2xl font-bold text-white font-mono mt-1 block">
            {(totalViews / 1000).toFixed(1)}k
          </span>
          <span className="text-[10px] text-[#F27D26] font-mono mt-0.5 block">+18.4% this cycle</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#0F0F0F] border border-white/10">
          <div className="flex items-center justify-between text-white/40 text-xs">
            <span className="text-[10px] uppercase tracking-widest opacity-60 font-bold">Avg 3s Retention</span>
            <TrendingUp className="w-3.5 h-3.5 text-[#F27D26]" />
          </div>
          <span className="text-2xl font-bold text-white font-mono mt-1 block">
            {avgRetention}%
          </span>
          <span className="text-[10px] text-white/40 font-mono mt-0.5 block">Benchmark: &gt;50%</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#0F0F0F] border border-white/10">
          <div className="flex items-center justify-between text-white/40 text-xs">
            <span className="text-[10px] uppercase tracking-widest opacity-60 font-bold">Saves & Bookmarks</span>
            <Bookmark className="w-3.5 h-3.5 text-[#F27D26]" />
          </div>
          <span className="text-2xl font-bold text-white font-mono mt-1 block">
            {(totalSaves / 1000).toFixed(1)}k
          </span>
          <span className="text-[10px] text-white/50 font-mono mt-0.5 block">High intent signal</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#0F0F0F] border border-white/10">
          <div className="flex items-center justify-between text-white/40 text-xs">
            <span className="text-[10px] uppercase tracking-widest opacity-60 font-bold">Winner Creatives</span>
            <Award className="w-3.5 h-3.5 text-[#F27D26]" />
          </div>
          <span className="text-2xl font-bold text-white font-mono mt-1 block">
            {winnerCreatives.length}
          </span>
          <span className="text-[10px] text-white/40 font-mono mt-0.5 block">Active scaling assets</span>
        </div>
      </div>

      {/* Navigation Sub-tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-px">
        {[
          { id: 'memory-search', label: 'Creative Memory Search & Q&A' },
          { id: 'intelligence', label: 'Winning Patterns & AI Learnings' },
          { id: 'metrics', label: 'Performance Table' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition cursor-pointer ${
              activeSubTab === tab.id
                ? 'border-[#F27D26] text-white bg-white/5 rounded-t-lg'
                : 'border-transparent text-white/40 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Sub-tab 1: Creative Memory Search & Q&A Assistant */}
      {activeSubTab === 'memory-search' && (
        <div className="space-y-5">
          {/* Query Bar */}
          <div className="p-6 rounded-2xl bg-[#0F0F0F] border border-white/10 space-y-3">
            <span className="text-[10px] uppercase tracking-widest opacity-40 font-bold text-white block">
              Ask Creative Memory
            </span>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. Que conteúdos já criámos sobre cafeína? Que hooks tiveram melhor retenção?"
                value={searchPrompt}
                onChange={(e) => setSearchPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleRunMemoryQuery()}
                className="flex-1 bg-black/60 border border-white/10 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-hidden focus:border-[#F27D26]"
              />
              <button
                onClick={() => handleRunMemoryQuery()}
                disabled={isSearchingMemory || !searchPrompt.trim()}
                className="px-4 py-2 rounded-lg bg-white hover:bg-neutral-200 text-black text-xs font-bold uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isSearchingMemory ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#F27D26]" />
                ) : (
                  <Search className="w-3.5 h-3.5 text-[#F27D26]" />
                )}
                <span>Search Memory</span>
              </button>
            </div>

            {/* Quick Query Pills */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] uppercase tracking-widest opacity-40 font-bold mr-1">Examples:</span>
              {quickMemoryQueries.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setSearchPrompt(q);
                    handleRunMemoryQuery(q);
                  }}
                  className="text-[11px] text-white/50 hover:text-white bg-black/40 border border-white/10 px-2.5 py-1 rounded-lg transition cursor-pointer"
                >
                  "{q}"
                </button>
              ))}
            </div>
          </div>

          {/* AI Memory Search Answer Card */}
          {memoryQueryResult && (
            <div className="p-6 rounded-2xl bg-[#0F0F0F] border border-[#F27D26]/40 shadow-xl space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <span className="text-xs font-bold text-[#F27D26] uppercase tracking-wider flex items-center gap-1.5">
                  <BrainCircuit className="w-4 h-4" />
                  <span>Creative Memory Answer</span>
                </span>
                <span className="text-[10px] text-white/40 font-mono">
                  Indexed from {memoryItems.length} records
                </span>
              </div>

              <p className="text-xs text-white/80 leading-relaxed whitespace-pre-line">
                {memoryQueryResult.answer}
              </p>

              {/* Key Insights bullets */}
              {memoryQueryResult.keyInsights?.length > 0 && (
                <div className="p-4 rounded-xl bg-black/60 border border-white/5 space-y-2">
                  <span className="text-[10px] font-bold text-[#F27D26] uppercase tracking-widest block">
                    Key Memory Insights:
                  </span>
                  <ul className="space-y-1 text-xs text-white/80">
                    {memoryQueryResult.keyInsights.map((insight, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-[#F27D26] font-bold">•</span>
                        <span>{insight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommended Next Steps */}
              {memoryQueryResult.recommendedNextSteps?.length > 0 && (
                <div className="p-4 rounded-xl bg-black/60 border border-white/5 space-y-2">
                  <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest block">
                    Actionable Recommendations for Next Production:
                  </span>
                  <ul className="space-y-1 text-xs text-white/80">
                    {memoryQueryResult.recommendedNextSteps.map((rec, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-[#F27D26] font-bold">→</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Memory Items Log */}
          <div className="space-y-3">
            <span className="text-[10px] uppercase tracking-widest opacity-40 font-bold text-white block">
              Recent Creative Memory Log ({memoryItems.length} entries)
            </span>

            <div className="space-y-2">
              {memoryItems.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-xl bg-[#0F0F0F] border border-white/10 flex items-start justify-between gap-3 text-xs"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[9px] uppercase px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-white/60">
                        {item.type}
                      </span>
                      <span className="text-white font-medium truncate">{item.topic}</span>
                      {item.isWinner && (
                        <span className="text-[9px] uppercase tracking-wider text-[#F27D26] bg-[#F27D26]/10 px-1.5 py-0.5 rounded font-bold border border-[#F27D26]/20">
                          🏆 Winner
                        </span>
                      )}
                    </div>
                    <p className="text-white/70 italic">"{item.content}"</p>
                    {item.performanceSummary && (
                      <span className="text-[11px] text-[#F27D26] block font-mono">
                        Result: {item.performanceSummary}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-white/40 shrink-0 font-mono">{item.date}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Sub-tab 2: Winning Patterns & AI Learnings */}
      {activeSubTab === 'intelligence' && (
        <div className="space-y-6">
          {optimizationReport ? (
            <div className="space-y-5">
              <div className="p-5 rounded-2xl bg-[#0F0F0F] border border-white/10 text-xs text-white/80 space-y-1">
                <span className="font-bold text-[#F27D26] text-[10px] uppercase tracking-widest block mb-1">
                  Executive Intelligence Summary:
                </span>
                <p className="leading-relaxed">{optimizationReport.summary}</p>
              </div>

              {/* Winning Patterns */}
              <div className="space-y-3">
                <span className="text-[10px] uppercase tracking-widest opacity-40 font-bold text-white block">
                  High-Confidence Winning Patterns ({optimizationReport.winningPatterns?.length || 0})
                </span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {optimizationReport.winningPatterns?.map((pat: any, i: number) => (
                    <div
                      key={i}
                      className="p-4 rounded-2xl bg-[#0F0F0F] border border-white/10 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-mono uppercase tracking-wider font-bold px-2 py-0.5 rounded bg-white/5 border border-white/10 text-white/80">
                          {pat.category}
                        </span>
                        <span className="text-[10px] font-mono text-[#F27D26] font-bold">
                          {pat.confidenceScore}% Conf.
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-white leading-snug">{pat.finding}</h4>
                      <div className="p-2 rounded-lg bg-black/60 border border-white/5 text-[11px] font-mono text-white/70">
                        Impact: {pat.impact}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Creative Recommendations */}
              <div className="space-y-3">
                <span className="text-[10px] uppercase tracking-widest opacity-40 font-bold text-white block">
                  AI Recommended Creative Concepts for Next Batch
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {optimizationReport.recommendations?.map((rec: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-[#0F0F0F] border border-white/10 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded bg-white/5 border border-white/10 text-white/60 font-semibold">
                          {rec.suggestedFormat}
                        </span>
                        <span className="text-[10px] text-[#F27D26] font-medium font-mono">
                          {rec.expectedImpact}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-white">{rec.title}</h4>
                      <p className="text-[11px] text-white/50">{rec.concept}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center border border-dashed border-white/10 rounded-2xl bg-[#0F0F0F] space-y-3">
              <BrainCircuit className="w-10 h-10 text-white/20 mx-auto" />
              <h3 className="text-base font-serif italic text-white">Extract Patterns with AI</h3>
              <p className="text-xs text-white/50 max-w-sm mx-auto">
                Click the "Extract Patterns" button above to evaluate all past winners and generate intelligence rules.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Sub-tab 3: Performance Table */}
      {activeSubTab === 'metrics' && (
        <div className="space-y-3">
          <span className="text-[10px] uppercase tracking-widest opacity-40 font-bold text-white block">
            Creative Performance Matrix ({creatives.length} Pieces)
          </span>

          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#0F0F0F]">
            <table className="w-full text-left text-xs text-white/70">
              <thead className="bg-[#141414] border-b border-white/10 text-[10px] font-bold uppercase tracking-widest text-white/40">
                <tr>
                  <th className="p-3.5">Creative</th>
                  <th className="p-3.5">Channel / Format</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Views</th>
                  <th className="p-3.5 text-right">3s Retention</th>
                  <th className="p-3.5 text-right">CTR</th>
                  <th className="p-3.5 text-right">Saves</th>
                  <th className="p-3.5 text-right">ROAS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono">
                {creatives.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => onSelectCreative(c)}
                    className="hover:bg-white/5 transition cursor-pointer"
                  >
                    <td className="p-3.5 font-sans">
                      <span className="font-mono text-white/40 font-bold mr-2">{c.code}</span>
                      <span className="font-semibold text-white truncate max-w-xs inline-block align-middle">
                        {c.title}
                      </span>
                    </td>
                    <td className="p-3.5 font-sans text-[11px]">
                      {c.channel} • {c.creativeFormat}
                    </td>
                    <td className="p-3.5 font-sans">
                      <span
                        className={`text-[9px] uppercase tracking-wider px-2 py-0.5 rounded font-bold ${
                          c.status === 'WINNER'
                            ? 'bg-[#F27D26] text-black'
                            : 'bg-white/5 border border-white/10 text-white/50'
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      {c.performance?.views ? (c.performance.views / 1000).toFixed(1) + 'k' : '—'}
                    </td>
                    <td className="p-3.5 text-right text-[#F27D26]">
                      {c.performance?.retentionRatePct ? `${c.performance.retentionRatePct}%` : '—'}
                    </td>
                    <td className="p-3.5 text-right">
                      {c.performance?.ctrPct ? `${c.performance.ctrPct}%` : '—'}
                    </td>
                    <td className="p-3.5 text-right text-white/80">
                      {c.performance?.saves ? c.performance.saves.toLocaleString() : '—'}
                    </td>
                    <td className="p-3.5 text-right font-bold text-white">
                      {c.performance?.roas ? `${c.performance.roas}x` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
