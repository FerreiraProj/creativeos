import React, { useEffect, useState } from 'react';
import JSZip from 'jszip';
import {
  Newspaper,
  Plus,
  Trash2,
  Sparkles,
  Copy,
  Check,
  Eye,
  X,
  Download,
  RefreshCw,
  Wand2,
  ArrowRight,
  ImageIcon,
  Archive,
} from 'lucide-react';
import { Project, AiGatewayConfig, BlogArticle, BlogArticleStatus, BlogArticleImages } from '../types';
import {
  generateBlogIdeas,
  generateBlogTitles,
  generateBlogArticleBody,
  editBlogArticleBody,
  generateBlogArticleImages,
  BlogIdeaResult,
} from '../lib/api';

interface BlogStudioProps {
  project: Project;
  aiGatewayConfig?: AiGatewayConfig;
  onUpdateBlogArticles: (blogArticles: BlogArticle[]) => void;
}

const STATUS_BADGE: Record<BlogArticleStatus, { label: string; className: string }> = {
  idea: { label: 'Idea', className: 'border-white/15 bg-white/5 text-white/60' },
  title_selection: { label: 'Choosing Title', className: 'border-blue-900 bg-blue-950/30 text-blue-300' },
  in_review: { label: 'In Review', className: 'border-amber-900 bg-amber-950/30 text-amber-300' },
  ready: { label: 'Ready', className: 'border-emerald-900 bg-emerald-950/30 text-emerald-300' },
};

const IMAGE_LABELS: { key: keyof BlogArticleImages; label: string; hint: string }[] = [
  { key: 'masterUrl', label: 'Master (9:16)', hint: 'Original render' },
  { key: 'instagramSquareUrl', label: 'Instagram Feed', hint: '1080×1080 · also Facebook square' },
  { key: 'instagramPortraitUrl', label: 'Instagram Portrait', hint: '1080×1350' },
  { key: 'instagramStoryUrl', label: 'Instagram Story/Reels', hint: '1080×1920' },
  { key: 'facebookUrl', label: 'Facebook Feed', hint: '1200×630' },
  { key: 'linkedinUrl', label: 'LinkedIn Feed', hint: '1200×627' },
  { key: 'twitterUrl', label: 'X (Twitter) Feed', hint: '1600×900' },
];

async function downloadUrl(url: string, filename: string) {
  const res = await fetch(url);
  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = objectUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(objectUrl);
}

export const BlogStudio: React.FC<BlogStudioProps> = ({ project, aiGatewayConfig, onUpdateBlogArticles }) => {
  const articles = project.blogArticles || [];
  const [selectedId, setSelectedId] = useState<string | null>(articles[0]?.id || null);
  const [isCreating, setIsCreating] = useState(articles.length === 0);

  const selectedArticle = articles.find((a) => a.id === selectedId) || null;

  // Creation flow (idea -> titles), not yet a persisted BlogArticle
  const [topicText, setTopicText] = useState('');
  const [aiIdeas, setAiIdeas] = useState<BlogIdeaResult[] | null>(null);
  const [isGeneratingIdeas, setIsGeneratingIdeas] = useState(false);
  const [ideasError, setIdeasError] = useState<string | null>(null);
  const [isConfirmingIdea, setIsConfirmingIdea] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  // Selected-article transient UI state
  const [isChoosingTitle, setIsChoosingTitle] = useState(false);
  const [isRegeneratingTitles, setIsRegeneratingTitles] = useState(false);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [editInstruction, setEditInstruction] = useState('');
  const [isApplyingEdit, setIsApplyingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  const [imagesError, setImagesError] = useState<string | null>(null);
  const [isZipping, setIsZipping] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<{ url: string; alt: string } | null>(null);

  useEffect(() => {
    setCopied(false);
    setEditInstruction('');
    setEditError(null);
    setImagesError(null);
    setTitleError(null);
  }, [selectedId]);

  const resetCreationState = () => {
    setTopicText('');
    setAiIdeas(null);
    setIdeasError(null);
    setConfirmError(null);
  };

  const handleStartNew = () => {
    resetCreationState();
    setIsCreating(true);
    setSelectedId(null);
  };

  const updateArticle = (id: string, patch: Partial<BlogArticle>) => {
    const updated = articles.map((a) =>
      a.id === id ? { ...a, ...patch, updatedAt: new Date().toISOString() } : a
    );
    onUpdateBlogArticles(updated);
  };

  const handleGenerateIdeas = async () => {
    setIsGeneratingIdeas(true);
    setIdeasError(null);
    try {
      const ideas = await generateBlogIdeas({
        brandMemory: project.brandMemory,
        blogArticles: articles,
        topic: topicText.trim() || undefined,
        aiGatewayConfig,
      });
      setAiIdeas(ideas);
    } catch (err: any) {
      setIdeasError(err.message || 'Failed to generate ideas.');
    } finally {
      setIsGeneratingIdeas(false);
    }
  };

  const handleConfirmIdea = async (ideaSummary: string, ideaSource: 'ai' | 'manual') => {
    if (!ideaSummary.trim()) return;
    setIsConfirmingIdea(true);
    setConfirmError(null);
    try {
      const titleOptions = await generateBlogTitles({
        brandMemory: project.brandMemory,
        ideaSummary,
        blogArticles: articles,
        aiGatewayConfig,
      });
      const newArticle: BlogArticle = {
        id: 'blog-' + Date.now(),
        status: 'title_selection',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ideaSource,
        ideaSummary,
        titleOptions,
        title: '',
        bodyMarkdown: '',
      };
      onUpdateBlogArticles([newArticle, ...articles]);
      setSelectedId(newArticle.id);
      setIsCreating(false);
      resetCreationState();
    } catch (err: any) {
      setConfirmError(err.message || 'Failed to generate title options.');
    } finally {
      setIsConfirmingIdea(false);
    }
  };

  const handleRegenerateTitles = async () => {
    if (!selectedArticle) return;
    setIsRegeneratingTitles(true);
    setTitleError(null);
    try {
      const titleOptions = await generateBlogTitles({
        brandMemory: project.brandMemory,
        ideaSummary: selectedArticle.ideaSummary,
        blogArticles: articles,
        aiGatewayConfig,
      });
      updateArticle(selectedArticle.id, { titleOptions });
    } catch (err: any) {
      setTitleError(err.message || 'Failed to regenerate titles.');
    } finally {
      setIsRegeneratingTitles(false);
    }
  };

  const handleChooseTitle = async (title: string) => {
    if (!selectedArticle) return;
    setIsChoosingTitle(true);
    setTitleError(null);
    try {
      const { bodyMarkdown } = await generateBlogArticleBody({
        brandMemory: project.brandMemory,
        title,
        ideaSummary: selectedArticle.ideaSummary,
        blogArticles: articles,
        aiGatewayConfig,
      });
      updateArticle(selectedArticle.id, { title, bodyMarkdown, status: 'in_review' });
    } catch (err: any) {
      setTitleError(err.message || 'Failed to generate the article.');
    } finally {
      setIsChoosingTitle(false);
    }
  };

  const handleCopyBody = () => {
    if (!selectedArticle) return;
    navigator.clipboard.writeText(selectedArticle.bodyMarkdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApplyEdit = async () => {
    if (!selectedArticle || !editInstruction.trim()) return;
    setIsApplyingEdit(true);
    setEditError(null);
    try {
      const { bodyMarkdown } = await editBlogArticleBody({
        brandMemory: project.brandMemory,
        title: selectedArticle.title,
        currentBodyMarkdown: selectedArticle.bodyMarkdown,
        instruction: editInstruction.trim(),
        aiGatewayConfig,
      });
      updateArticle(selectedArticle.id, { bodyMarkdown });
      setEditInstruction('');
    } catch (err: any) {
      setEditError(err.message || 'Failed to apply the requested edit.');
    } finally {
      setIsApplyingEdit(false);
    }
  };

  const handleToggleReady = () => {
    if (!selectedArticle) return;
    updateArticle(selectedArticle.id, {
      status: selectedArticle.status === 'ready' ? 'in_review' : 'ready',
    });
  };

  const handleGenerateImages = async () => {
    if (!selectedArticle) return;
    setIsGeneratingImages(true);
    setImagesError(null);
    try {
      const prompt = `Editorial hero image for a blog article titled "${selectedArticle.title}". Article context: ${selectedArticle.ideaSummary}. Visual style: ${project.brandMemory?.visualIdentity?.styleAesthetic || 'clean, modern, on-brand editorial photography'}. Composed for a 9:16 vertical crop with the key subject centered, safe margins on all sides, no text or logos baked into the image.`;
      const { images } = await generateBlogArticleImages({ prompt, aiGatewayConfig });
      updateArticle(selectedArticle.id, { images });
    } catch (err: any) {
      setImagesError(err.message || 'Failed to generate article images.');
    } finally {
      setIsGeneratingImages(false);
    }
  };

  const handleDownloadAllImages = async () => {
    if (!selectedArticle?.images) return;
    setIsZipping(true);
    try {
      const zip = new JSZip();
      const entries = Object.entries(selectedArticle.images) as [keyof BlogArticleImages, string][];
      await Promise.all(
        entries.map(async ([key, url]) => {
          const res = await fetch(url);
          const blob = await res.blob();
          zip.file(`${key.replace('Url', '')}.jpg`, blob);
        })
      );
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const objectUrl = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = `${(selectedArticle.title || 'blog-article').replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-images.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (err) {
      console.error('Failed to build zip download:', err);
    } finally {
      setIsZipping(false);
    }
  };

  const handleDeleteArticle = (id: string) => {
    if (confirm('Delete this blog article?')) {
      const updated = articles.filter((a) => a.id !== id);
      onUpdateBlogArticles(updated);
      if (selectedId === id) {
        setSelectedId(updated[0]?.id || null);
        setIsCreating(updated.length === 0);
      }
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-[#F27D26]">
              <Newspaper className="w-4 h-4" />
            </span>
            <h1 className="text-xl font-serif italic text-white tracking-tight">
              Blog Studio — {project.name}
            </h1>
          </div>
          <p className="text-xs text-white/50 mt-1">
            Generate on-brand blog articles from AI ideas or your own, then review, edit, and export ready-to-post images.
          </p>
        </div>

        <button
          onClick={handleStartNew}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white hover:bg-neutral-200 text-black font-bold uppercase tracking-wider text-xs transition shadow-sm cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5] text-[#F27D26]" />
          <span>New Article</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Article List (Col 4) */}
        <div className="lg:col-span-4 space-y-3">
          <span className="text-[10px] uppercase tracking-widest opacity-40 font-bold text-white block px-1">
            Articles ({articles.length})
          </span>

          {articles.length === 0 && !isCreating ? (
            <div className="p-8 text-center border border-dashed border-white/10 rounded-2xl bg-[#0F0F0F]">
              <Newspaper className="w-8 h-8 text-white/30 mx-auto mb-2" />
              <p className="text-xs text-white/50">No blog articles yet.</p>
              <button
                onClick={handleStartNew}
                className="mt-3 text-xs text-[#F27D26] hover:underline font-medium cursor-pointer"
              >
                + Write first article
              </button>
            </div>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {articles.map((article) => {
                const isSelected = !isCreating && selectedArticle?.id === article.id;
                const badge = STATUS_BADGE[article.status];
                return (
                  <div
                    key={article.id}
                    onClick={() => {
                      setSelectedId(article.id);
                      setIsCreating(false);
                    }}
                    className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-start justify-between gap-2 ${
                      isSelected
                        ? 'bg-[#141414] border-[#F27D26] shadow-sm'
                        : 'bg-[#0F0F0F] border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="min-w-0">
                      <h3 className="text-xs font-bold text-white truncate">
                        {article.title || article.ideaSummary || 'Untitled idea'}
                      </h3>
                      <span
                        className={`inline-block mt-1.5 text-[9px] font-mono font-medium px-2 py-0.5 rounded border ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteArticle(article.id);
                      }}
                      className="text-white/30 hover:text-rose-400 p-1.5 transition cursor-pointer shrink-0"
                      title="Delete article"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Working Panel (Col 8) */}
        <div className="lg:col-span-8">
          {isCreating ? (
            <div className="p-6 rounded-2xl bg-[#0F0F0F] border border-white/10 space-y-5">
              <h3 className="text-base font-serif italic text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#F27D26]" />
                <span>Start a New Article</span>
              </h3>

              <div>
                <label className="text-[10px] uppercase tracking-widest opacity-40 font-bold block mb-1">
                  Idea, Topic Hint, or Write Your Own
                </label>
                <textarea
                  rows={3}
                  placeholder="Write your own idea directly, or leave a topic hint and let AI suggest 5 ideas below."
                  value={topicText}
                  onChange={(e) => setTopicText(e.target.value)}
                  className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-hidden focus:border-[#F27D26]"
                />
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <button
                    type="button"
                    onClick={handleGenerateIdeas}
                    disabled={isGeneratingIdeas || isConfirmingIdea}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold uppercase tracking-wider transition cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3 h-3 text-[#F27D26] ${isGeneratingIdeas ? 'animate-spin' : ''}`} />
                    <span>{isGeneratingIdeas ? 'Generating…' : 'Generate 5 Ideas'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleConfirmIdea(topicText.trim(), 'manual')}
                    disabled={!topicText.trim() || isConfirmingIdea || isGeneratingIdeas}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F27D26]/10 hover:bg-[#F27D26]/20 border border-[#F27D26]/30 text-[#F27D26] text-[11px] font-bold uppercase tracking-wider transition cursor-pointer disabled:opacity-40"
                  >
                    <ArrowRight className="w-3 h-3" />
                    <span>{isConfirmingIdea ? 'Working…' : 'Use This Idea'}</span>
                  </button>
                </div>
                {ideasError && (
                  <p className="text-[11px] text-rose-400 bg-rose-950/30 border border-rose-500/20 rounded-lg px-2.5 py-1.5 mt-2">
                    {ideasError}
                  </p>
                )}
                {confirmError && (
                  <p className="text-[11px] text-rose-400 bg-rose-950/30 border border-rose-500/20 rounded-lg px-2.5 py-1.5 mt-2">
                    {confirmError}
                  </p>
                )}
              </div>

              {aiIdeas && aiIdeas.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] uppercase tracking-widest opacity-40 font-bold text-white block">
                    Pick an Idea
                  </span>
                  {aiIdeas.map((idea, i) => (
                    <div
                      key={i}
                      className="p-3.5 rounded-xl bg-black/40 border border-white/10 hover:border-[#F27D26]/40 transition space-y-1.5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <h4 className="text-xs font-bold text-white">{idea.title}</h4>
                        <button
                          type="button"
                          onClick={() => handleConfirmIdea(idea.summary, 'ai')}
                          disabled={isConfirmingIdea}
                          className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-bold uppercase bg-white/10 hover:bg-white/20 text-white transition cursor-pointer disabled:opacity-40"
                        >
                          <span>Use This</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                      <p className="text-[11px] text-white/60">{idea.summary}</p>
                      <div className="flex flex-wrap gap-1.5 text-[10px] text-white/40">
                        <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10">{idea.angle}</span>
                        <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10">{idea.targetAudience}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : selectedArticle ? (
            <div className="space-y-4">
              {/* Title selection */}
              {selectedArticle.status === 'title_selection' && (
                <div className="p-6 rounded-2xl bg-[#0F0F0F] border border-white/10 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-white/10">
                    <h3 className="text-base font-serif italic text-white">Choose a Title</h3>
                    <button
                      type="button"
                      onClick={handleRegenerateTitles}
                      disabled={isRegeneratingTitles || isChoosingTitle}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold uppercase tracking-wider transition cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3 h-3 text-[#F27D26] ${isRegeneratingTitles ? 'animate-spin' : ''}`} />
                      <span>{isRegeneratingTitles ? 'Regenerating…' : 'Regenerate Titles'}</span>
                    </button>
                  </div>

                  {titleError && (
                    <p className="text-[11px] text-rose-400 bg-rose-950/30 border border-rose-500/20 rounded-lg px-2.5 py-1.5">
                      {titleError}
                    </p>
                  )}

                  <div className="space-y-2">
                    {selectedArticle.titleOptions.map((opt, i) => (
                      <div
                        key={i}
                        className="p-3.5 rounded-xl bg-black/40 border border-white/10 hover:border-[#F27D26]/40 transition flex items-start justify-between gap-3"
                      >
                        <div>
                          <h4 className="text-sm font-bold text-white">{opt.title}</h4>
                          {opt.rationale && <p className="text-[11px] text-white/50 mt-1">{opt.rationale}</p>}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleChooseTitle(opt.title)}
                          disabled={isChoosingTitle || isRegeneratingTitles}
                          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-neutral-200 text-black text-[10px] font-bold uppercase tracking-wider transition cursor-pointer disabled:opacity-50"
                        >
                          <span>{isChoosingTitle ? 'Writing…' : 'Choose'}</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Review / Ready: body editor */}
              {(selectedArticle.status === 'in_review' || selectedArticle.status === 'ready') && (
                <div className="p-6 rounded-2xl bg-[#0F0F0F] border border-white/10 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
                    <div className="min-w-0">
                      <h2 className="text-lg font-serif italic text-white truncate">{selectedArticle.title}</h2>
                      <span
                        className={`inline-block mt-1 text-[9px] font-mono font-medium px-2 py-0.5 rounded border ${STATUS_BADGE[selectedArticle.status].className}`}
                      >
                        {STATUS_BADGE[selectedArticle.status].label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={handleCopyBody}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white text-[11px] font-bold uppercase tracking-wider transition cursor-pointer"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-[#F27D26]" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copied ? 'Copied' : 'Copy Text'}</span>
                      </button>
                      <button
                        onClick={handleToggleReady}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition cursor-pointer ${
                          selectedArticle.status === 'ready'
                            ? 'bg-white/5 hover:bg-white/10 border border-white/10 text-white/60'
                            : 'bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-300'
                        }`}
                      >
                        {selectedArticle.status === 'ready' ? 'Reopen for Review' : 'Mark as Ready'}
                      </button>
                    </div>
                  </div>

                  <textarea
                    rows={16}
                    value={selectedArticle.bodyMarkdown}
                    onChange={(e) => updateArticle(selectedArticle.id, { bodyMarkdown: e.target.value })}
                    className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2.5 text-xs text-white font-mono leading-relaxed focus:outline-hidden focus:border-[#F27D26]"
                  />

                  {/* Instruction-driven edit */}
                  <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-[#F27D26] font-bold flex items-center gap-1.5">
                      <Wand2 className="w-3.5 h-3.5" />
                      <span>Ask AI to Rewrite Any Part</span>
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        placeholder="e.g. Make the introduction shorter, add a section about X, soften the tone in the closing paragraph…"
                        value={editInstruction}
                        onChange={(e) => setEditInstruction(e.target.value)}
                        className="flex-1 bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-hidden focus:border-[#F27D26]"
                      />
                      <button
                        type="button"
                        onClick={handleApplyEdit}
                        disabled={!editInstruction.trim() || isApplyingEdit}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white hover:bg-neutral-200 text-black text-[11px] font-bold uppercase tracking-wider transition cursor-pointer disabled:opacity-50 shrink-0"
                      >
                        <RefreshCw className={`w-3 h-3 ${isApplyingEdit ? 'animate-spin' : ''}`} />
                        <span>{isApplyingEdit ? 'Applying…' : 'Apply Edit'}</span>
                      </button>
                    </div>
                    {editError && (
                      <p className="text-[11px] text-rose-400 bg-rose-950/30 border border-rose-500/20 rounded-lg px-2.5 py-1.5">
                        {editError}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Image generation (once a title exists) */}
              {selectedArticle.title && selectedArticle.status !== 'title_selection' && (
                <div className="p-6 rounded-2xl bg-[#0F0F0F] border border-white/10 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
                    <h3 className="text-base font-serif italic text-white flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-[#F27D26]" />
                      <span>Article Images</span>
                    </h3>
                    <div className="flex items-center gap-2">
                      {selectedArticle.images && (
                        <button
                          type="button"
                          onClick={handleDownloadAllImages}
                          disabled={isZipping}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white text-[11px] font-bold uppercase tracking-wider transition cursor-pointer disabled:opacity-50"
                        >
                          <Archive className={`w-3.5 h-3.5 ${isZipping ? 'animate-pulse' : ''}`} />
                          <span>{isZipping ? 'Zipping…' : 'Download All (.zip)'}</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={handleGenerateImages}
                        disabled={isGeneratingImages}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-neutral-200 text-black text-[11px] font-bold uppercase tracking-wider transition cursor-pointer disabled:opacity-50"
                      >
                        <Sparkles className={`w-3.5 h-3.5 text-[#F27D26] ${isGeneratingImages ? 'animate-pulse' : ''}`} />
                        <span>{isGeneratingImages ? 'Generating… (~1 min)' : selectedArticle.images ? 'Regenerate Images' : 'Generate Images'}</span>
                      </button>
                    </div>
                  </div>

                  {imagesError && (
                    <p className="text-[11px] text-rose-400 bg-rose-950/30 border border-rose-500/20 rounded-lg px-2.5 py-1.5">
                      {imagesError}
                    </p>
                  )}

                  {!selectedArticle.images ? (
                    <p className="text-xs text-white/40">
                      Generates one master image (framed 9:16) and automatically crops it into every social format below — no re-generation per platform.
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {IMAGE_LABELS.map(({ key, label, hint }) => {
                        const url = selectedArticle.images![key];
                        return (
                          <div key={key} className="rounded-xl overflow-hidden border border-white/10 bg-black/40">
                            <button
                              type="button"
                              onClick={() => setLightboxImage({ url, alt: label })}
                              className="relative w-full aspect-square block group cursor-zoom-in"
                              title="Click to enlarge"
                            >
                              <img src={url} alt={label} className="w-full h-full object-cover" />
                              <span className="absolute inset-0 bg-black/0 group-hover:bg-black/50 flex items-center justify-center transition">
                                <Eye className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition" />
                              </span>
                            </button>
                            <div className="p-2 flex items-center justify-between gap-2">
                              <div className="min-w-0">
                                <p className="text-[10px] font-bold text-white truncate">{label}</p>
                                <p className="text-[9px] text-white/40 truncate">{hint}</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => downloadUrl(url, `${key.replace('Url', '')}.jpg`)}
                                className="shrink-0 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition cursor-pointer"
                                title="Download this image"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>

      {/* Image Lightbox */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 cursor-zoom-out"
          onClick={() => setLightboxImage(null)}
        >
          <button
            onClick={() => setLightboxImage(null)}
            className="absolute top-4 right-4 text-white/60 hover:text-white p-2 rounded-lg hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <img
            src={lightboxImage.url}
            alt={lightboxImage.alt}
            onClick={(e) => e.stopPropagation()}
            className="max-w-[90vw] max-h-[85vh] object-contain rounded-2xl border border-white/10 shadow-2xl cursor-default"
          />
        </div>
      )}
    </div>
  );
};
