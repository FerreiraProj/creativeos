import React, { useState } from 'react';
import {
  BookOpen,
  Sparkles,
  Check,
  Plus,
  Trash2,
  Package,
  Eye,
  ShieldCheck,
  Info,
  Palette,
  Target,
  MessageSquare,
  Globe,
} from 'lucide-react';
import { Project, BrandMemory, ProductServiceItem, ContentChannel } from '../types';

interface BrandMemoryViewProps {
  project: Project;
  onUpdateBrandMemory: (updated: BrandMemory) => void;
}

export const BrandMemoryView: React.FC<BrandMemoryViewProps> = ({
  project,
  onUpdateBrandMemory,
}) => {
  const [memory, setMemory] = useState<BrandMemory>(project.brandMemory);
  const [activeTab, setActiveTab] = useState<'overview' | 'audience' | 'tone' | 'products' | 'visual' | 'ai-prompt'>('overview');
  const [isSaved, setIsSaved] = useState(false);

  // New product temp state
  const [newProdName, setNewProdName] = useState('');
  const [newProdType, setNewProdType] = useState<'Product' | 'Service'>('Product');
  const [newProdUsp, setNewProdUsp] = useState('');
  const [newProdHook, setNewProdHook] = useState('');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdDesc, setNewProdDesc] = useState('');

  // Pain point & Desires temp states
  const [newPainPoint, setNewPainPoint] = useState('');
  const [newDesire, setNewDesire] = useState('');
  const [newDo, setNewDo] = useState('');
  const [newDont, setNewDont] = useState('');

  const allChannels: ContentChannel[] = [
    'Instagram',
    'TikTok',
    'YouTube',
    'Facebook',
    'LinkedIn',
    'Paid Ads',
    'Twitter/X',
  ];

  const handleSave = () => {
    onUpdateBrandMemory(memory);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const toggleChannel = (channel: ContentChannel) => {
    const exists = memory.channels.includes(channel);
    const updated = exists
      ? memory.channels.filter((c) => c !== channel)
      : [...memory.channels, channel];
    setMemory({ ...memory, channels: updated });
  };

  const addPainPoint = () => {
    if (!newPainPoint.trim()) return;
    setMemory({
      ...memory,
      targetAudience: {
        ...memory.targetAudience,
        painPoints: [...memory.targetAudience.painPoints, newPainPoint.trim()],
      },
    });
    setNewPainPoint('');
  };

  const removePainPoint = (index: number) => {
    setMemory({
      ...memory,
      targetAudience: {
        ...memory.targetAudience,
        painPoints: memory.targetAudience.painPoints.filter((_, i) => i !== index),
      },
    });
  };

  const addDesire = () => {
    if (!newDesire.trim()) return;
    setMemory({
      ...memory,
      targetAudience: {
        ...memory.targetAudience,
        desires: [...memory.targetAudience.desires, newDesire.trim()],
      },
    });
    setNewDesire('');
  };

  const removeDesire = (index: number) => {
    setMemory({
      ...memory,
      targetAudience: {
        ...memory.targetAudience,
        desires: memory.targetAudience.desires.filter((_, i) => i !== index),
      },
    });
  };

  const addDo = () => {
    if (!newDo.trim()) return;
    setMemory({
      ...memory,
      communicationTone: {
        ...memory.communicationTone,
        dos: [...memory.communicationTone.dos, newDo.trim()],
      },
    });
    setNewDo('');
  };

  const removeDo = (index: number) => {
    setMemory({
      ...memory,
      communicationTone: {
        ...memory.communicationTone,
        dos: memory.communicationTone.dos.filter((_, i) => i !== index),
      },
    });
  };

  const addDont = () => {
    if (!newDont.trim()) return;
    setMemory({
      ...memory,
      communicationTone: {
        ...memory.communicationTone,
        donts: [...memory.communicationTone.donts, newDont.trim()],
      },
    });
    setNewDont('');
  };

  const removeDont = (index: number) => {
    setMemory({
      ...memory,
      communicationTone: {
        ...memory.communicationTone,
        donts: memory.communicationTone.donts.filter((_, i) => i !== index),
      },
    });
  };

  const addProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim()) return;
    const newItem: ProductServiceItem = {
      id: 'prod-' + Date.now(),
      name: newProdName.trim(),
      type: newProdType,
      description: newProdDesc.trim(),
      usp: newProdUsp.trim(),
      pricing: newProdPrice.trim(),
      heroHook: newProdHook.trim(),
    };
    setMemory({
      ...memory,
      products: [...(memory.products || []), newItem],
    });
    setNewProdName('');
    setNewProdUsp('');
    setNewProdHook('');
    setNewProdPrice('');
    setNewProdDesc('');
  };

  const removeProduct = (id: string) => {
    setMemory({
      ...memory,
      products: memory.products.filter((p) => p.id !== id),
    });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-[#F27D26]">
              <BookOpen className="w-4 h-4" />
            </span>
            <h1 className="text-xl font-serif italic text-white tracking-tight">
              Brand Memory — {project.name}
            </h1>
          </div>
          <p className="text-xs text-white/50 mt-1">
            Permanent brand knowledge engine. The AI uses this context whenever generating ideas, scripts, and creative shots.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleSave}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition shadow-sm cursor-pointer ${
              isSaved
                ? 'bg-[#F27D26] text-black'
                : 'bg-white hover:bg-neutral-200 text-black'
            }`}
          >
            {isSaved ? <Check className="w-4 h-4" /> : <Sparkles className="w-4 h-4 text-[#F27D26]" />}
            <span>{isSaved ? 'Saved' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      {/* Sub-nav tabs */}
      <div className="flex items-center gap-1.5 border-b border-white/10 pb-px overflow-x-auto">
        {[
          { id: 'overview', label: 'Identity & Positioning', icon: <Target className="w-3.5 h-3.5" /> },
          { id: 'audience', label: 'Audience & Pains', icon: <Info className="w-3.5 h-3.5" /> },
          { id: 'tone', label: 'Tone & Guardrails', icon: <MessageSquare className="w-3.5 h-3.5" /> },
          { id: 'products', label: 'Products & Offers', icon: <Package className="w-3.5 h-3.5" /> },
          { id: 'visual', label: 'Visual Identity', icon: <Palette className="w-3.5 h-3.5" /> },
          { id: 'ai-prompt', label: 'AI Context Inspector', icon: <Eye className="w-3.5 h-3.5" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium border-b-2 whitespace-nowrap transition cursor-pointer ${
              activeTab === tab.id
                ? 'border-[#F27D26] text-white bg-white/5 rounded-t-lg font-semibold'
                : 'border-transparent text-white/40 hover:text-white hover:bg-white/[0.02]'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab 1: Overview & Positioning */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl bg-[#0F0F0F] border border-white/10 space-y-4">
            <h3 className="font-serif italic text-base text-white mb-2">Core Profile</h3>
            <div>
              <label className="text-[10px] uppercase tracking-widest opacity-40 font-bold block mb-1">
                Brand / Project Name
              </label>
              <input
                type="text"
                value={memory.name}
                onChange={(e) => setMemory({ ...memory, name: e.target.value })}
                className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-[#F27D26] focus:outline-hidden"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-widest opacity-40 font-bold block mb-1">
                Business Area & Industry
              </label>
              <input
                type="text"
                placeholder="e.g. Cognitive Performance, Luxury Gastronomy, B2B SaaS"
                value={memory.businessArea}
                onChange={(e) => setMemory({ ...memory, businessArea: e.target.value })}
                className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-[#F27D26] focus:outline-hidden"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-widest opacity-40 font-bold block mb-1">
                Communication Language
              </label>
              <input
                type="text"
                placeholder="e.g. Portuguese (PT), English (US), Spanish"
                value={memory.language}
                onChange={(e) => setMemory({ ...memory, language: e.target.value })}
                className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-[#F27D26] focus:outline-hidden"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-widest opacity-40 font-bold block mb-1.5">
                Active Channels & Platforms
              </label>
              <div className="flex flex-wrap gap-1.5">
                {allChannels.map((c) => {
                  const selected = memory.channels.includes(c);
                  return (
                    <button
                      type="button"
                      key={c}
                      onClick={() => toggleChannel(c)}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium border transition cursor-pointer ${
                        selected
                          ? 'bg-[#F27D26]/20 border-[#F27D26]/40 text-[#F27D26]'
                          : 'bg-white/5 border-white/10 text-white/50 hover:border-white/20 hover:text-white'
                      }`}
                    >
                      {selected ? '✓ ' : '+ '}
                      {c}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-[#0F0F0F] border border-white/10 space-y-4">
            <h3 className="font-serif italic text-base text-white mb-2">Narrative & Position</h3>
            <div>
              <label className="text-[10px] uppercase tracking-widest opacity-40 font-bold block mb-1">
                Brand Core Narrative & Mission
              </label>
              <textarea
                rows={3}
                placeholder="What is the permanent mission of this brand?"
                value={memory.description}
                onChange={(e) => setMemory({ ...memory, description: e.target.value })}
                className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-[#F27D26] focus:outline-hidden"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-widest opacity-40 font-bold block mb-1">
                Market Positioning Statement
              </label>
              <textarea
                rows={3}
                placeholder="e.g. The premium cognitive focus supplement for builders under heavy mental load."
                value={memory.positioning}
                onChange={(e) => setMemory({ ...memory, positioning: e.target.value })}
                className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-[#F27D26] focus:outline-hidden"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-widest opacity-40 font-bold block mb-1">
                Key Market Differentiation (USP vs Competitors)
              </label>
              <textarea
                rows={2}
                placeholder="What makes this brand radically different from legacy competitors?"
                value={memory.differentiation}
                onChange={(e) => setMemory({ ...memory, differentiation: e.target.value })}
                className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-[#F27D26] focus:outline-hidden"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Target Audience & Pain Points */}
      {activeTab === 'audience' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-[#0F0F0F] border border-white/10 space-y-3">
            <h3 className="font-serif italic text-base text-white">Target Audience & Demographics</h3>
            <textarea
              rows={3}
              placeholder="e.g. High-performance software engineers, founders, and content creators aged 24-45."
              value={memory.targetAudience.demographics}
              onChange={(e) =>
                setMemory({
                  ...memory,
                  targetAudience: {
                    ...memory.targetAudience,
                    demographics: e.target.value,
                  },
                })
              }
              className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-[#F27D26] focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Pain Points */}
            <div className="p-6 rounded-2xl bg-[#0F0F0F] border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-widest text-rose-400 font-bold">
                  Target Pain Points & Frustrations ({memory.targetAudience.painPoints.length})
                </span>
              </div>
              <div className="space-y-2">
                {memory.targetAudience.painPoints.map((pain, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-lg bg-black/50 border border-white/5 text-xs text-white/80"
                  >
                    <span className="line-clamp-2">{pain}</span>
                    <button
                      onClick={() => removePainPoint(idx)}
                      className="text-white/40 hover:text-rose-400 p-1 shrink-0 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 pt-2">
                <input
                  type="text"
                  placeholder="Add pain point (e.g. 3pm brain fog)..."
                  value={newPainPoint}
                  onChange={(e) => setNewPainPoint(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addPainPoint()}
                  className="flex-1 bg-black/60 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-hidden focus:border-[#F27D26]"
                />
                <button
                  type="button"
                  onClick={addPainPoint}
                  className="px-4 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Core Desires */}
            <div className="p-6 rounded-2xl bg-[#0F0F0F] border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-widest text-[#F27D26] font-bold">
                  Core Desires & Dream Outcomes ({memory.targetAudience.desires.length})
                </span>
              </div>
              <div className="space-y-2">
                {memory.targetAudience.desires.map((desire, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-lg bg-black/50 border border-white/5 text-xs text-white/80"
                  >
                    <span className="line-clamp-2">{desire}</span>
                    <button
                      onClick={() => removeDesire(idx)}
                      className="text-white/40 hover:text-rose-400 p-1 shrink-0 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 pt-2">
                <input
                  type="text"
                  placeholder="Add desire (e.g. 6 hours clean flow state)..."
                  value={newDesire}
                  onChange={(e) => setNewDesire(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addDesire()}
                  className="flex-1 bg-black/60 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-hidden focus:border-[#F27D26]"
                />
                <button
                  type="button"
                  onClick={addDesire}
                  className="px-4 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Tone of Voice & Guardrails */}
      {activeTab === 'tone' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-[#0F0F0F] border border-white/10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-[10px] uppercase tracking-widest opacity-40 font-bold block mb-1">
                  Communication Tone
                </label>
                <input
                  type="text"
                  placeholder="e.g. Direct, scientifically backed, authentic, empathetic"
                  value={memory.communicationTone.tone}
                  onChange={(e) =>
                    setMemory({
                      ...memory,
                      communicationTone: {
                        ...memory.communicationTone,
                        tone: e.target.value,
                      },
                    })
                  }
                  className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-[#F27D26] focus:outline-hidden"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest opacity-40 font-bold block mb-1">
                  Style Guide Summary
                </label>
                <input
                  type="text"
                  placeholder="e.g. Avoid cheap miracle promises; explain biological mechanisms naturally"
                  value={memory.communicationTone.styleGuide}
                  onChange={(e) =>
                    setMemory({
                      ...memory,
                      communicationTone: {
                        ...memory.communicationTone,
                        styleGuide: e.target.value,
                      },
                    })
                  }
                  className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-[#F27D26] focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* DOs */}
            <div className="p-6 rounded-2xl bg-[#0F0F0F] border border-white/10 space-y-4">
              <span className="text-[10px] uppercase tracking-widest text-[#F27D26] font-bold">
                Mandatory DOs ({memory.communicationTone.dos.length})
              </span>
              <div className="space-y-2">
                {memory.communicationTone.dos.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-lg bg-black/50 border border-white/5 text-xs text-white/80"
                  >
                    <span>✓ {item}</span>
                    <button
                      onClick={() => removeDo(idx)}
                      className="text-white/40 hover:text-rose-400 p-1 shrink-0 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 pt-2">
                <input
                  type="text"
                  placeholder="Add rule to follow..."
                  value={newDo}
                  onChange={(e) => setNewDo(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addDo()}
                  className="flex-1 bg-black/60 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-hidden focus:border-[#F27D26]"
                />
                <button
                  type="button"
                  onClick={addDo}
                  className="px-4 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  Add
                </button>
              </div>
            </div>

            {/* DONTs */}
            <div className="p-6 rounded-2xl bg-[#0F0F0F] border border-white/10 space-y-4">
              <span className="text-[10px] uppercase tracking-widest text-rose-400 font-bold">
                Forbidden DON'Ts ({memory.communicationTone.donts.length})
              </span>
              <div className="space-y-2">
                {memory.communicationTone.donts.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-lg bg-black/50 border border-white/5 text-xs text-white/80"
                  >
                    <span>✕ {item}</span>
                    <button
                      onClick={() => removeDont(idx)}
                      className="text-white/40 hover:text-rose-400 p-1 shrink-0 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 pt-2">
                <input
                  type="text"
                  placeholder="Add forbidden practice..."
                  value={newDont}
                  onChange={(e) => setNewDont(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addDont()}
                  className="flex-1 bg-black/60 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-hidden focus:border-[#F27D26]"
                />
                <button
                  type="button"
                  onClick={addDont}
                  className="px-4 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Products & Catalog */}
      {activeTab === 'products' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {memory.products?.map((prod) => (
              <div
                key={prod.id}
                className="p-6 rounded-2xl bg-[#0F0F0F] border border-white/10 space-y-3 relative group"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[9px] uppercase font-mono px-2 py-0.5 rounded bg-white/10 text-white/80 border border-white/10">
                      {prod.type}
                    </span>
                    <h3 className="text-base font-serif italic text-white mt-1.5">{prod.name}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    {prod.pricing && (
                      <span className="text-xs font-mono text-[#F27D26] font-semibold">{prod.pricing}</span>
                    )}
                    <button
                      onClick={() => removeProduct(prod.id)}
                      className="text-white/40 hover:text-rose-400 p-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-white/60">{prod.description}</p>

                <div className="p-3 rounded-xl bg-black/50 border border-white/5 text-xs text-white/80">
                  <span className="font-semibold text-[#F27D26]">USP: </span>
                  {prod.usp}
                </div>

                {prod.heroHook && (
                  <div className="p-3 rounded-xl bg-black/50 border border-white/5 text-xs text-white/70 italic">
                    <span className="font-semibold text-white">Hero Hook: </span>
                    "{prod.heroHook}"
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Add product form */}
          <form onSubmit={addProduct} className="p-6 rounded-2xl bg-[#0F0F0F] border border-white/10 space-y-4">
            <h3 className="font-serif italic text-base text-white">
              + Add Product or Service to Catalog
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                placeholder="Item Name (e.g. Nootrion Flow State)"
                value={newProdName}
                onChange={(e) => setNewProdName(e.target.value)}
                className="bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-[#F27D26]"
              />
              <select
                value={newProdType}
                onChange={(e) => setNewProdType(e.target.value as any)}
                className="bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-[#F27D26]"
              >
                <option value="Product">Physical Product</option>
                <option value="Service">Service / Digital SaaS</option>
              </select>
              <input
                type="text"
                placeholder="Pricing (e.g. 49.90€ / mo)"
                value={newProdPrice}
                onChange={(e) => setNewProdPrice(e.target.value)}
                className="bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-[#F27D26]"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Key USP & Formula / Features"
                value={newProdUsp}
                onChange={(e) => setNewProdUsp(e.target.value)}
                className="bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-[#F27D26]"
              />
              <input
                type="text"
                placeholder="Hero Hook Example for Scripts"
                value={newProdHook}
                onChange={(e) => setNewProdHook(e.target.value)}
                className="bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-[#F27D26]"
              />
            </div>
            <textarea
              rows={2}
              placeholder="Product description and clinical benefits..."
              value={newProdDesc}
              onChange={(e) => setNewProdDesc(e.target.value)}
              className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-[#F27D26]"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                className="px-5 py-2 bg-white hover:bg-neutral-200 text-black text-xs font-bold uppercase tracking-wider rounded-lg transition cursor-pointer"
              >
                Add to Brand Catalog
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 5: Visual Identity */}
      {activeTab === 'visual' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl bg-[#0F0F0F] border border-white/10 space-y-4">
            <h3 className="font-serif italic text-base text-white">Aesthetic Guidelines</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] uppercase tracking-widest opacity-40 font-bold block mb-1">
                  Primary Color (Hex)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={memory.visualIdentity.primaryColor}
                    onChange={(e) =>
                      setMemory({
                        ...memory,
                        visualIdentity: {
                          ...memory.visualIdentity,
                          primaryColor: e.target.value,
                        },
                      })
                    }
                    className="w-8 h-8 rounded border border-white/15 bg-transparent cursor-pointer"
                  />
                  <input
                    type="text"
                    value={memory.visualIdentity.primaryColor}
                    onChange={(e) =>
                      setMemory({
                        ...memory,
                        visualIdentity: {
                          ...memory.visualIdentity,
                          primaryColor: e.target.value,
                        },
                      })
                    }
                    className="flex-1 bg-black/60 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-widest opacity-40 font-bold block mb-1">
                  Accent Color (Hex)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={memory.visualIdentity.accentColor}
                    onChange={(e) =>
                      setMemory({
                        ...memory,
                        visualIdentity: {
                          ...memory.visualIdentity,
                          accentColor: e.target.value,
                        },
                      })
                    }
                    className="w-8 h-8 rounded border border-white/15 bg-transparent cursor-pointer"
                  />
                  <input
                    type="text"
                    value={memory.visualIdentity.accentColor}
                    onChange={(e) =>
                      setMemory({
                        ...memory,
                        visualIdentity: {
                          ...memory.visualIdentity,
                          accentColor: e.target.value,
                        },
                      })
                    }
                    className="flex-1 bg-black/60 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] uppercase tracking-widest opacity-40 font-bold block mb-1">
                  Display / Title Font
                </label>
                <input
                  type="text"
                  placeholder="e.g. Cormorant Garamond, Syne"
                  value={memory.visualIdentity.fontTitle}
                  onChange={(e) =>
                    setMemory({
                      ...memory,
                      visualIdentity: {
                        ...memory.visualIdentity,
                        fontTitle: e.target.value,
                      },
                    })
                  }
                  className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-widest opacity-40 font-bold block mb-1">
                  Body Font
                </label>
                <input
                  type="text"
                  placeholder="e.g. Plus Jakarta Sans, Inter"
                  value={memory.visualIdentity.fontBody}
                  onChange={(e) =>
                    setMemory({
                      ...memory,
                      visualIdentity: {
                        ...memory.visualIdentity,
                        fontBody: e.target.value,
                      },
                    })
                  }
                  className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-widest opacity-40 font-bold block mb-1">
                Visual Style Aesthetic & Lighting Guidelines
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Clean dark background, bio-optic amber accents, natural desk lighting, authentic iPhone UGC look."
                value={memory.visualIdentity.styleAesthetic}
                onChange={(e) =>
                  setMemory({
                    ...memory,
                    visualIdentity: {
                      ...memory.visualIdentity,
                      styleAesthetic: e.target.value,
                    },
                  })
                }
                className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>
          </div>

          {/* Live brand preview swatch */}
          <div className="p-6 rounded-2xl border border-white/10 bg-[#0F0F0F] flex flex-col justify-between">
            <span className="text-[10px] uppercase tracking-widest opacity-40 font-bold text-white">
              Brand Visual Card Preview
            </span>

            <div
              className="my-4 p-6 rounded-2xl border border-white/10 shadow-2xl"
              style={{
                backgroundColor: memory.visualIdentity.primaryColor || '#050505',
                borderLeft: `4px solid ${memory.visualIdentity.accentColor || '#F27D26'}`,
              }}
            >
              <span
                className="text-[10px] font-bold uppercase tracking-widest block"
                style={{ color: memory.visualIdentity.accentColor || '#F27D26' }}
              >
                {memory.name || 'Brand Name'}
              </span>
              <h4 className="text-xl font-serif italic text-white mt-1.5">
                {memory.positioning || 'Positioning statement goes here.'}
              </h4>
              <p className="text-xs text-white/60 mt-2 line-clamp-2">
                {memory.description || 'Brand description and core value proposition.'}
              </p>
            </div>

            <div className="text-[10px] text-white/40 font-mono">
              Palette: {memory.visualIdentity.primaryColor} • {memory.visualIdentity.accentColor} | Fonts: {memory.visualIdentity.fontTitle} / {memory.visualIdentity.fontBody}
            </div>
          </div>
        </div>
      )}

      {/* Tab 6: AI Prompt & Context Inspector */}
      {activeTab === 'ai-prompt' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-black/60 border border-[#F27D26]/30 text-xs text-white/80 flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 shrink-0 text-[#F27D26]" />
            <span>
              Zero contamination guarantee: Only the isolated JSON payload below is transmitted to the AI Gateway for project{' '}
              <strong className="text-white">"{project.name}"</strong>.
            </span>
          </div>

          <div className="relative">
            <pre className="p-5 rounded-2xl bg-[#0F0F0F] border border-white/10 text-xs font-mono text-white/70 overflow-x-auto max-h-96 leading-relaxed">
              {JSON.stringify(memory, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
