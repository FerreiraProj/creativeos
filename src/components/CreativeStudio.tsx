import React, { useState, useRef } from 'react';
import {
  Sparkles,
  Wand2,
  Clapperboard,
  BookOpen,
  Users,
  Layers,
  ArrowRight,
  RefreshCw,
  Plus,
  Check,
  Zap,
  MessageSquare,
  Lightbulb,
  FileText,
  Sliders,
  ShieldCheck,
  Send,
  ShoppingBag,
  AlertCircle,
  HelpCircle,
  Edit3,
  X,
  ChevronDown,
  RotateCcw,
} from 'lucide-react';
import {
  Project,
  Creative,
  Character,
  ContentChannel,
  ContentType,
  CreativeFormat,
  CreativeObjective,
  Recipe,
  AiGatewayConfig,
} from '../types';
import { PRESET_RECIPES } from '../lib/constants';
import {
  generateCreativeIdeas,
  generateFullScript,
  regenerateSingleShot,
  IdeaResult,
  GeneratedScriptResult,
} from '../lib/api';

interface CreativeStudioProps {
  project: Project;
  aiGatewayConfig?: AiGatewayConfig;
  onSaveCreativeAndOpenShots: (newCreative: Creative) => void;
  onUpdateCreativeMemory: (item: any) => void;
}

interface ObjectiveOption {
  id: CreativeObjective;
  title: string;
  subtitle: string;
  badge: string;
  badgeColor: string;
  description: string;
  ctaExample: string;
  icon: React.ComponentType<{ className?: string }>;
}

const OBJECTIVE_OPTIONS: ObjectiveOption[] = [
  {
    id: 'authority_educational',
    title: 'Informativo & Didático',
    subtitle: 'Ganhar Autoridade (Zero Venda)',
    badge: 'Sem Vendas · Autoridade',
    badgeColor: 'border-blue-500/30 bg-blue-500/10 text-blue-400',
    description: 'Educar profundamente, desmistificar crenças e explicar a ciência ou método prático sem qualquer pressão de compra.',
    ctaExample: 'CTA: Guardar post, partilhar com amigos ou seguir para mais conteúdos.',
    icon: BookOpen,
  },
  {
    id: 'indirect_lead_dm',
    title: 'Venda Indireta (Puxar para DM)',
    subtitle: 'Conversa 1-a-1 no Direct Message',
    badge: 'Lead Magnet · Iniciar DM',
    badgeColor: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
    description: 'Despertar curiosidade extrema e partilhar 80% do valor. Convidar o público a enviar DM para receber o guia/protocolo e converter em conversa.',
    ctaExample: 'CTA: "Envia \'FOCO\' na DM", "Manda \'PROTOCOLO\' no direct"',
    icon: MessageSquare,
  },
  {
    id: 'direct_sale_cta',
    title: 'Venda Direta (Conversão)',
    subtitle: 'Call to Action Imediata',
    badge: 'Conversão · Resposta Direta',
    badgeColor: 'border-[#F27D26]/40 bg-[#F27D26]/10 text-[#F27D26]',
    description: 'Apresentar dor urgente, introduzir o produto/serviço como a solução definitiva, quebrar objeções e direcionar para compra no link.',
    ctaExample: 'CTA: "Clica no link da bio", "Garante o teu frasco com desconto"',
    icon: Zap,
  },
];

export const CreativeStudio: React.FC<CreativeStudioProps> = ({
  project,
  aiGatewayConfig,
  onSaveCreativeAndOpenShots,
  onUpdateCreativeMemory,
}) => {
  const [activeRole, setActiveRole] = useState<'strategist' | 'scriptwriter' | 'producer'>('strategist');

  // CRITICAL REQUIREMENT: No default selection; user must explicitly choose one of the 3 objectives
  const [selectedObjective, setSelectedObjective] = useState<CreativeObjective | null>(null);
  const [objectiveErrorShake, setObjectiveErrorShake] = useState(false);
  const objectiveSectionRef = useRef<HTMLDivElement>(null);

  // Input states
  const [topicPrompt, setTopicPrompt] = useState('');
  const [selectedChannel, setSelectedChannel] = useState<ContentChannel>('Instagram');
  const [selectedContentType, setSelectedContentType] = useState<ContentType>('Reel');
  const [selectedFormat, setSelectedFormat] = useState<CreativeFormat>('AI UGC');
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>('recipe-ai-ugc');
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>(
    project.characters?.[0]?.id || ''
  );
  const [targetDuration, setTargetDuration] = useState<number>(25);

  // AI Output states
  const [isGeneratingIdeas, setIsGeneratingIdeas] = useState(false);
  const [generatedIdeas, setGeneratedIdeas] = useState<IdeaResult[]>([]);
  const [selectedIdea, setSelectedIdea] = useState<IdeaResult | null>(null);

  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [generatedScript, setGeneratedScript] = useState<GeneratedScriptResult | null>(null);

  // Per-shot individual speech regeneration & editing states
  const [regeneratingShotIndex, setRegeneratingShotIndex] = useState<number | null>(null);
  const [editingShotIndex, setEditingShotIndex] = useState<number | null>(null);
  const [editedSpeechText, setEditedSpeechText] = useState<string>('');
  const [openPromptShotIndex, setOpenPromptShotIndex] = useState<number | null>(null);
  const [customShotPrompt, setCustomShotPrompt] = useState<string>('');

  const [isRegeneratingHook, setIsRegeneratingHook] = useState(false);
  const [isRegeneratingCta, setIsRegeneratingCta] = useState(false);

  const allRecipes = [...PRESET_RECIPES, ...(project.customRecipes || [])];
  const selectedCharacter = project.characters?.find((c) => c.id === selectedCharacterId);

  // Handle Idea Generation
  const handleGenerateIdeas = async () => {
    if (!selectedObjective) {
      setObjectiveErrorShake(true);
      objectiveSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => setObjectiveErrorShake(false), 2500);
      return;
    }

    setIsGeneratingIdeas(true);
    try {
      const ideas = await generateCreativeIdeas({
        brandMemory: project.brandMemory,
        creativeMemory: project.creativeMemory,
        topic: topicPrompt,
        channel: selectedChannel,
        format: selectedFormat,
        creativeObjective: selectedObjective,
        count: 4,
        aiGatewayConfig,
      });
      setGeneratedIdeas(ideas);
      if (ideas.length > 0) {
        setSelectedIdea(ideas[0]);
      }
    } finally {
      setIsGeneratingIdeas(false);
    }
  };

  // Handle Script Generation
  const handleGenerateScript = async (ideaToUse?: IdeaResult) => {
    const currentIdea = ideaToUse || selectedIdea;
    if (!currentIdea) return;
    if (!selectedObjective) {
      setObjectiveErrorShake(true);
      return;
    }

    setIsGeneratingScript(true);
    try {
      const script = await generateFullScript({
        brandMemory: project.brandMemory,
        creativeMemory: project.creativeMemory,
        idea: currentIdea,
        character: selectedCharacter,
        channel: selectedChannel,
        format: selectedFormat,
        creativeObjective: selectedObjective,
        targetDuration,
        aiGatewayConfig,
      });
      setGeneratedScript(script);
      setActiveRole('producer');
    } finally {
      setIsGeneratingScript(false);
    }
  };

  // Handle Single Shot Speech Refresh / Regeneration
  const handleRegenerateShotSpeech = async (shotIndex: number, instruction?: string) => {
    if (!generatedScript || !generatedScript.shots[shotIndex]) return;
    const targetShot = generatedScript.shots[shotIndex];

    setRegeneratingShotIndex(shotIndex);
    try {
      const defaultInstruction =
        instruction ||
        (targetShot.shotNumber === 1
          ? 'Gera uma frase de gancho com paragem de scroll pura, SEM qualquer chamada para ação ou menção de envio de DM.'
          : 'Torna esta frase mais conversacional, direta e natural.');

      const newShot = await regenerateSingleShot({
        brandMemory: project.brandMemory,
        character: selectedCharacter,
        shotNumber: targetShot.shotNumber,
        shotType: targetShot.type,
        previousSpokenText: targetShot.spokenText,
        instruction: defaultInstruction,
        creativeObjective: selectedObjective || undefined,
        fullTitle: generatedScript.fullTitle,
        aiGatewayConfig,
      });

      const updatedShots = [...generatedScript.shots];
      updatedShots[shotIndex] = {
        ...targetShot,
        spokenText: newShot.spokenText,
        onScreenText: newShot.onScreenText || targetShot.onScreenText,
        visualPrompt: newShot.visualPrompt || targetShot.visualPrompt,
        characterEmotion: newShot.characterEmotion || targetShot.characterEmotion,
      };

      const updatedScript: GeneratedScriptResult = {
        ...generatedScript,
        shots: updatedShots,
        overallHook: shotIndex === 0 ? newShot.spokenText : generatedScript.overallHook,
        mainCta:
          shotIndex === updatedShots.length - 1 ? newShot.spokenText : generatedScript.mainCta,
      };

      setGeneratedScript(updatedScript);
      setOpenPromptShotIndex(null);
      setCustomShotPrompt('');
    } finally {
      setRegeneratingShotIndex(null);
    }
  };

  // Handle Inline Manual Speech Edit
  const handleStartEditingShot = (shotIndex: number, currentText: string) => {
    setEditingShotIndex(shotIndex);
    setEditedSpeechText(currentText);
    setOpenPromptShotIndex(null);
  };

  const handleSaveEditedShot = (shotIndex: number) => {
    if (!generatedScript || !generatedScript.shots[shotIndex]) return;

    const updatedShots = [...generatedScript.shots];
    updatedShots[shotIndex] = {
      ...updatedShots[shotIndex],
      spokenText: editedSpeechText.trim(),
    };

    setGeneratedScript({
      ...generatedScript,
      shots: updatedShots,
      overallHook: shotIndex === 0 ? editedSpeechText.trim() : generatedScript.overallHook,
      mainCta:
        shotIndex === updatedShots.length - 1
          ? editedSpeechText.trim()
          : generatedScript.mainCta,
    });
    setEditingShotIndex(null);
  };

  // Handle Hook Regeneration from top box
  const handleRegenerateOverallHook = async () => {
    if (!generatedScript || !generatedScript.shots[0]) return;
    setIsRegeneratingHook(true);
    try {
      await handleRegenerateShotSpeech(
        0,
        'Cria uma nova opção de gancho forte de curiosidade sem qualquer call to action ou convite de DM.'
      );
    } finally {
      setIsRegeneratingHook(false);
    }
  };

  // Handle CTA Regeneration from top box
  const handleRegenerateOverallCta = async () => {
    if (!generatedScript || generatedScript.shots.length === 0) return;
    const lastIdx = generatedScript.shots.length - 1;
    setIsRegeneratingCta(true);
    try {
      await handleRegenerateShotSpeech(
        lastIdx,
        'Gera uma nova chamada de ação (CTA) alinhada exatamente com o objetivo do criativo.'
      );
    } finally {
      setIsRegeneratingCta(false);
    }
  };

  // Create Creative & Push to Shot Studio
  const handleCommitToProduction = () => {
    if (!generatedScript && !selectedIdea) return;

    const existingCodeNumbers = (project.creatives || [])
      .map((c) => parseInt(c.code.split('-').pop() || '', 10))
      .filter((n) => !isNaN(n));
    const nextCodeNumber =
      existingCodeNumbers.length > 0 ? Math.max(...existingCodeNumbers) + 1 : 128;
    const creativeCode = `#${project.codePrefix}-${String(nextCodeNumber).padStart(5, '0')}`;

    const newCreative: Creative = {
      id: 'cr-' + Date.now(),
      code: creativeCode,
      title: generatedScript?.fullTitle || selectedIdea?.title || 'New Creative Piece',
      theme: selectedIdea?.theme || 'Brand Campaign',
      topic: topicPrompt || selectedIdea?.angle || 'Performance focus',
      channel: selectedChannel,
      contentType: selectedContentType,
      creativeFormat: selectedFormat,
      creativeObjective: selectedObjective || undefined,
      recipeId: selectedRecipeId,
      characterId: selectedCharacterId || undefined,
      status: 'PRODUCTION',
      hook: generatedScript?.overallHook || selectedIdea?.hookIdea || '',
      scriptBody:
        generatedScript?.shots?.map((s) => `[Shot ${s.shotNumber}] ${s.spokenText}`).join('\n\n') || '',
      cta: generatedScript?.mainCta || 'Visit link to learn more.',
      targetDuration,
      tags: [
        selectedFormat,
        selectedChannel,
        selectedObjective ? selectedObjective.replace('_', ' ') : 'General',
        selectedCharacter?.name || 'Generic',
      ].filter(Boolean),
      shots:
        generatedScript?.shots?.map((s, idx) => ({
          id: 'shot-' + Date.now() + '-' + idx,
          shotNumber: s.shotNumber || idx + 1,
          type: s.type || 'Hook',
          durationSec: s.durationSec || 5,
          spokenText: s.spokenText,
          visualPrompt: s.visualPrompt,
          cameraMovement: s.cameraMovement,
          characterEmotion: s.characterEmotion,
          onScreenText: s.onScreenText,
          imageUrl: selectedCharacter?.referenceImageUrl,
          status: 'ready',
        })) || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save hook to creative memory
    if (newCreative.hook) {
      onUpdateCreativeMemory({
        id: 'mem-' + Date.now(),
        creativeId: newCreative.id,
        date: new Date().toISOString().split('T')[0],
        type: 'hook',
        content: newCreative.hook,
        topic: newCreative.topic,
        channel: newCreative.channel,
        format: newCreative.creativeFormat,
        characterName: selectedCharacter?.name,
      });
    }

    onSaveCreativeAndOpenShots(newCreative);
  };

  const selectedObjectiveObj = OBJECTIVE_OPTIONS.find((o) => o.id === selectedObjective);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-[#F27D26]">
              <Sparkles className="w-4 h-4" />
            </span>
            <h1 className="text-xl font-serif italic text-white tracking-tight">
              AI Creative Studio — {project.name}
            </h1>
          </div>
          <p className="text-xs text-white/50 mt-1">
            Gera ganchos, ângulos de retenção e guiões com regeneração individual de falas por shot.
          </p>
        </div>

        {/* Specialized Agent Role Selector */}
        <div className="flex items-center gap-1 bg-white/5 border border-white/10 p-1 rounded-xl">
          <button
            onClick={() => setActiveRole('strategist')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition cursor-pointer ${
              activeRole === 'strategist'
                ? 'bg-white text-black font-bold shadow-sm'
                : 'text-white/50 hover:text-white'
            }`}
          >
            1. Estrategista
          </button>
          <button
            onClick={() => setActiveRole('scriptwriter')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition cursor-pointer ${
              activeRole === 'scriptwriter'
                ? 'bg-white text-black font-bold shadow-sm'
                : 'text-white/50 hover:text-white'
            }`}
          >
            2. Guiões
          </button>
          <button
            onClick={() => setActiveRole('producer')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition cursor-pointer ${
              activeRole === 'producer'
                ? 'bg-white text-black font-bold shadow-sm'
                : 'text-white/50 hover:text-white'
            }`}
          >
            3. Produção
          </button>
        </div>
      </div>

      {/* PRIMARY SELECTION SECTION: 3 MANDATORY CREATIVE TYPES */}
      <div
        ref={objectiveSectionRef}
        className={`p-6 rounded-2xl bg-[#0F0F0F] border transition-all duration-300 space-y-4 ${
          objectiveErrorShake
            ? 'border-red-500 ring-2 ring-red-500/30 bg-red-950/10'
            : selectedObjective
            ? 'border-white/10'
            : 'border-amber-500/40 bg-amber-950/5'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-widest font-bold text-white opacity-40">
                Passo 1 Obrigatório
              </span>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30 uppercase font-semibold">
                * Escolha Obrigatória
              </span>
            </div>
            <h2 className="text-base font-semibold text-white mt-1">
              Qual é o objetivo deste Criativo?
            </h2>
            <p className="text-xs text-white/50">
              Escolhe uma das 3 estratégias de comunicação. Nenhuma opção vem marcada por defeito.
            </p>
          </div>

          {!selectedObjective ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-medium self-start sm:self-auto animate-pulse">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Seleciona 1 opção para avançar</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium self-start sm:self-auto">
              <Check className="w-3.5 h-3.5" />
              <span>Objetivo: <strong>{selectedObjectiveObj?.title}</strong></span>
            </div>
          )}
        </div>

        {/* 3 Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1">
          {OBJECTIVE_OPTIONS.map((opt) => {
            const isSelected = selectedObjective === opt.id;
            const Icon = opt.icon;

            return (
              <div
                key={opt.id}
                onClick={() => {
                  setSelectedObjective(opt.id);
                  setObjectiveErrorShake(false);
                }}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 relative text-left group ${
                  isSelected
                    ? 'bg-[#151515] border-[#F27D26] ring-1 ring-[#F27D26] shadow-lg'
                    : 'bg-black/50 border-white/10 hover:border-white/25 hover:bg-white/5'
                }`}
              >
                {/* Selection Radio / Check Indicator */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`p-2 rounded-lg border transition ${
                        isSelected
                          ? 'bg-[#F27D26]/20 border-[#F27D26] text-[#F27D26]'
                          : 'bg-white/5 border-white/10 text-white/40 group-hover:text-white'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </span>
                    <div>
                      <h3 className="text-xs font-bold text-white leading-tight">
                        {opt.title}
                      </h3>
                      <span className="text-[10px] text-white/40 block leading-tight mt-0.5">
                        {opt.subtitle}
                      </span>
                    </div>
                  </div>

                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition ${
                      isSelected
                        ? 'bg-[#F27D26] border-[#F27D26] text-black'
                        : 'border-white/20 bg-black/40 group-hover:border-white/40'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </div>

                {/* Description */}
                <p className="text-[11px] text-white/60 leading-relaxed">
                  {opt.description}
                </p>

                {/* Tag & CTA Guideline */}
                <div className="pt-2 border-t border-white/5 space-y-1.5">
                  <span
                    className={`text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded border inline-block font-semibold ${opt.badgeColor}`}
                  >
                    {opt.badge}
                  </span>
                  <p className="text-[10px] text-white/40 italic line-clamp-1">
                    {opt.ctaExample}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Control Column (Creative Configuration) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-6 rounded-2xl bg-[#0F0F0F] border border-white/10 space-y-4">
            <span className="text-[10px] uppercase tracking-widest opacity-40 font-bold text-white flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-[#F27D26]" />
              <span>Parâmetros de Geração</span>
            </span>

            {/* Topic / Angle */}
            <div>
              <label className="text-[10px] uppercase tracking-widest opacity-40 font-bold block mb-1">
                Ângulo ou Tema do Criativo
              </label>
              <textarea
                rows={2}
                placeholder="Ex: Cansaço da tarde vs adenosina, rotina de deep work, café e quebra de foco..."
                value={topicPrompt}
                onChange={(e) => setTopicPrompt(e.target.value)}
                className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-hidden focus:border-[#F27D26]"
              />
            </div>

            {/* Target Channel & Content Type */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] uppercase tracking-widest opacity-40 font-bold block mb-1">Canal</label>
                <select
                  value={selectedChannel}
                  onChange={(e) => setSelectedChannel(e.target.value as any)}
                  className="w-full bg-black/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-hidden focus:border-[#F27D26]"
                >
                  <option value="Instagram">Instagram</option>
                  <option value="TikTok">TikTok</option>
                  <option value="YouTube">YouTube</option>
                  <option value="Paid Ads">Paid Ads</option>
                  <option value="Facebook">Facebook</option>
                  <option value="LinkedIn">LinkedIn</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-widest opacity-40 font-bold block mb-1">Tipo</label>
                <select
                  value={selectedContentType}
                  onChange={(e) => setSelectedContentType(e.target.value as any)}
                  className="w-full bg-black/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-hidden focus:border-[#F27D26]"
                >
                  <option value="Reel">Reel</option>
                  <option value="TikTok Video">TikTok Video</option>
                  <option value="YouTube Short">YouTube Short</option>
                  <option value="Carousel">Carrossel</option>
                  <option value="Advertisement">Anúncio Pago</option>
                  <option value="Story">Story</option>
                </select>
              </div>
            </div>

            {/* Format & Recipe */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] uppercase tracking-widest opacity-40 font-bold block mb-1">Formato</label>
                <select
                  value={selectedFormat}
                  onChange={(e) => setSelectedFormat(e.target.value as any)}
                  className="w-full bg-black/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-hidden focus:border-[#F27D26]"
                >
                  <option value="AI UGC">AI UGC</option>
                  <option value="Cinematic">Cinematográfico</option>
                  <option value="Product Video">Vídeo de Produto</option>
                  <option value="Faceless">Faceless (Voz + B-roll)</option>
                  <option value="Talking Head">Talking Head</option>
                  <option value="Carousel">Carrossel</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-widest opacity-40 font-bold block mb-1">Receita</label>
                <select
                  value={selectedRecipeId}
                  onChange={(e) => setSelectedRecipeId(e.target.value)}
                  className="w-full bg-black/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-hidden focus:border-[#F27D26] truncate"
                >
                  {allRecipes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Character Selection */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] uppercase tracking-widest opacity-40 font-bold">Personagem Âncora</label>
                <span className="text-[10px] text-white/40 font-mono">
                  {project.characters?.length || 0} disponíveis
                </span>
              </div>
              <select
                value={selectedCharacterId}
                onChange={(e) => setSelectedCharacterId(e.target.value)}
                className="w-full bg-black/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-hidden focus:border-[#F27D26]"
              >
                <option value="">Sem personagem / Genérico</option>
                {project.characters?.map((char) => (
                  <option key={char.id} value={char.id}>
                    {char.name} ({char.role})
                  </option>
                ))}
              </select>

              {selectedCharacter && (
                <div className="mt-2 p-3 rounded-xl bg-black/50 border border-white/10 flex items-center gap-3">
                  {selectedCharacter.referenceImageUrl ? (
                    <img
                      src={selectedCharacter.referenceImageUrl}
                      alt={selectedCharacter.name}
                      className="w-9 h-9 rounded-full object-cover border border-white/20 shrink-0"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-[#F27D26]/20 text-[#F27D26] border border-[#F27D26]/40 flex items-center justify-center font-bold text-xs shrink-0">
                      {selectedCharacter.name[0]}
                    </div>
                  )}
                  <div className="min-w-0">
                    <span className="text-xs font-semibold text-white truncate block">
                      {selectedCharacter.name}
                    </span>
                    <span className="text-[10px] text-white/50 line-clamp-1">
                      {selectedCharacter.personality}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Generate Action Button */}
            <button
              onClick={handleGenerateIdeas}
              disabled={isGeneratingIdeas}
              className={`w-full py-2.5 rounded-lg font-bold uppercase tracking-wider text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-sm ${
                !selectedObjective
                  ? 'bg-white/10 text-white/40 border border-white/10 hover:bg-white/15'
                  : 'bg-white hover:bg-neutral-200 text-black'
              }`}
            >
              {isGeneratingIdeas ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-[#F27D26]" />
                  <span>A consultar Brand Memory...</span>
                </>
              ) : !selectedObjective ? (
                <>
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                  <span>Escolhe o Objetivo do Criativo</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4 text-[#F27D26]" />
                  <span>Gerar Ângulos & Ganchos ({selectedObjectiveObj?.badge})</span>
                </>
              )}
            </button>

            {!selectedObjective && (
              <p className="text-[10px] text-amber-300 text-center">
                * Escolhe um dos 3 objetivos acima para ativar a geração com IA.
              </p>
            )}
          </div>

          {/* Active Brand Memory Context Badge */}
          <div className="p-4 rounded-2xl bg-[#0F0F0F] border border-white/10 text-xs text-white/60 space-y-1.5">
            <span className="text-[10px] uppercase tracking-widest text-[#F27D26] font-bold block">
              🧠 Memória Ativa de {project.name}:
            </span>
            <p className="line-clamp-2 text-white/70">
              <strong className="text-white">Posicionamento:</strong> {project.brandMemory.positioning || project.brandMemory.description}
            </p>
            <p className="line-clamp-1 text-white/60">
              <strong className="text-white/80">Dores da Persona:</strong> {project.brandMemory.targetAudience?.painPoints?.[0] || 'N/A'}
            </p>
            <p className="line-clamp-1 text-white/60">
              <strong className="text-white/80">Ganchos na Memória:</strong> {project.creativeMemory?.length || 0} indexados
            </p>
          </div>
        </div>

        {/* Right Output Column (Idea Selector / Script / Breakdown) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Step 1: Strategist Ideas */}
          {generatedIdeas.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-white flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5 text-[#F27D26]" />
                  <span>Ângulos Estratégicos Gerados ({generatedIdeas.length})</span>
                </span>
                {selectedObjectiveObj && (
                  <span className={`text-[9px] font-mono px-2 py-0.5 rounded border ${selectedObjectiveObj.badgeColor}`}>
                    {selectedObjectiveObj.title}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {generatedIdeas.map((idea, idx) => {
                  const isSelected = selectedIdea?.title === idea.title;
                  return (
                    <div
                      key={idx}
                      onClick={() => setSelectedIdea(idea)}
                      className={`p-4 rounded-2xl border transition cursor-pointer space-y-2.5 relative ${
                        isSelected
                          ? 'bg-[#0F0F0F] border-[#F27D26] shadow-lg'
                          : 'bg-[#0F0F0F] border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-white/5 border border-white/10 text-white/70 uppercase tracking-wider font-semibold">
                          {idea.angle}
                        </span>
                        <span className="text-[10px] text-[#F27D26] font-semibold">
                          {idea.targetEmotion}
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-white line-clamp-2">{idea.title}</h4>

                      <div className="p-2.5 rounded-xl bg-black/60 border border-white/5 text-xs text-white/80 italic">
                        <span className="text-[#F27D26] font-semibold not-italic">Hook: </span>"
                        {idea.hookIdea}"
                      </div>

                      <p className="text-[11px] text-white/50 line-clamp-2">
                        <strong className="text-white/70">Visual Hook:</strong> {idea.visualHook}
                      </p>

                      {isSelected && (
                        <div className="pt-2 flex justify-end">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleGenerateScript(idea);
                            }}
                            disabled={isGeneratingScript}
                            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#F27D26] hover:bg-[#df6d19] text-black text-xs font-bold uppercase tracking-wider rounded-lg transition cursor-pointer shadow-sm"
                          >
                            {isGeneratingScript ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <FileText className="w-3.5 h-3.5" />
                            )}
                            <span>Escrever Guião em Shots</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 2 & 3: Generated Script & Interactive Shot Breakdown */}
          {generatedScript ? (
            <div className="p-6 rounded-2xl bg-[#0F0F0F] border border-white/10 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-mono uppercase tracking-widest px-2 py-0.5 rounded bg-white/10 text-white/80 border border-white/10">
                      Guião Estruturado (~{generatedScript.estimatedTotalDuration || 25}s)
                    </span>
                    {selectedObjectiveObj && (
                      <span className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded border ${selectedObjectiveObj.badgeColor}`}>
                        {selectedObjectiveObj.title}
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-serif italic text-white mt-1.5">
                    {generatedScript.fullTitle}
                  </h3>
                </div>

                <button
                  onClick={handleCommitToProduction}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg bg-white hover:bg-neutral-200 text-black font-bold uppercase tracking-wider text-xs transition shadow-sm cursor-pointer self-start sm:self-auto"
                >
                  <Clapperboard className="w-4 h-4 text-[#F27D26]" />
                  <span>Enviar para o Shot Studio</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Hook & CTA callouts with 1-click individual refresh buttons */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-4 rounded-xl bg-black/60 border border-white/5 text-xs relative group">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] uppercase tracking-widest text-[#F27D26] font-bold">
                      Gancho Principal (0-3s):
                    </span>
                    <button
                      onClick={handleRegenerateOverallHook}
                      disabled={isRegeneratingHook}
                      title="Regenerar Gancho"
                      className="p-1 rounded bg-white/5 hover:bg-white/15 text-white/60 hover:text-white transition flex items-center gap-1 text-[10px] cursor-pointer"
                    >
                      <RefreshCw className={`w-3 h-3 text-[#F27D26] ${isRegeneratingHook ? 'animate-spin' : ''}`} />
                      <span>Trocar Gancho</span>
                    </button>
                  </div>
                  <p className="text-white italic">"{generatedScript.overallHook}"</p>
                </div>

                <div className="p-4 rounded-xl bg-black/60 border border-white/5 text-xs relative group">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] uppercase tracking-widest text-white/60 font-bold">
                      Call to Action ({selectedObjectiveObj?.badge}):
                    </span>
                    <button
                      onClick={handleRegenerateOverallCta}
                      disabled={isRegeneratingCta}
                      title="Regenerar CTA"
                      className="p-1 rounded bg-white/5 hover:bg-white/15 text-white/60 hover:text-white transition flex items-center gap-1 text-[10px] cursor-pointer"
                    >
                      <RefreshCw className={`w-3 h-3 text-emerald-400 ${isRegeneratingCta ? 'animate-spin' : ''}`} />
                      <span>Trocar CTA</span>
                    </button>
                  </div>
                  <p className="text-white font-medium">"{generatedScript.mainCta}"</p>
                </div>
              </div>

              {/* Sequential Shots List with Granular Speech Regeneration & Inline Edit */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-widest opacity-40 font-bold text-white block">
                    Divisão Sequencial de Shots (~5s cada) — {generatedScript.shots?.length || 0} Shots
                  </span>
                  <span className="text-[10px] text-white/40 italic">
                    Clica em 🔄 para regenerar qualquer fala individualmente
                  </span>
                </div>

                {generatedScript.shots?.map((shot, idx) => {
                  const isRegeneratingThisShot = regeneratingShotIndex === idx;
                  const isEditingThisShot = editingShotIndex === idx;
                  const isPromptOpen = openPromptShotIndex === idx;

                  return (
                    <div
                      key={shot.shotNumber || idx}
                      className={`p-4 rounded-xl border transition space-y-2.5 ${
                        isRegeneratingThisShot
                          ? 'bg-[#151515] border-[#F27D26]/50 shadow-md animate-pulse'
                          : 'bg-black/50 border-white/5 hover:border-white/15'
                      }`}
                    >
                      {/* Shot Top Row / Metadata & Actions */}
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-mono px-2 py-0.5 rounded bg-white/10 text-white font-bold text-[10px]">
                            Shot #{shot.shotNumber}
                          </span>
                          <span className="font-semibold text-[#F27D26] text-xs">{shot.type}</span>
                          <span className="text-[11px] text-white/40 font-mono">
                            ~{shot.durationSec}s
                          </span>
                          <span className="text-[10px] text-white/40 italic hidden sm:inline">
                            • {shot.characterEmotion}
                          </span>
                        </div>

                        {/* Individual Shot Actions */}
                        <div className="flex items-center gap-1.5">
                          {/* Quick Edit Toggle Button */}
                          <button
                            onClick={() => {
                              if (isEditingThisShot) {
                                handleSaveEditedShot(idx);
                              } else {
                                handleStartEditingShot(idx, shot.spokenText);
                              }
                            }}
                            className={`px-2.5 py-1 rounded text-[11px] font-medium transition flex items-center gap-1 cursor-pointer ${
                              isEditingThisShot
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/10'
                            }`}
                            title="Editar fala manualmente"
                          >
                            {isEditingThisShot ? (
                              <>
                                <Check className="w-3 h-3" />
                                <span>Guardar</span>
                              </>
                            ) : (
                              <>
                                <Edit3 className="w-3 h-3" />
                                <span>Editar</span>
                              </>
                            )}
                          </button>

                          {isEditingThisShot && (
                            <button
                              onClick={() => setEditingShotIndex(null)}
                              className="p-1 rounded bg-white/5 hover:bg-white/10 text-white/50 hover:text-white cursor-pointer"
                              title="Cancelar edição"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Instant 1-Click AI Speech Refresh Button */}
                          <button
                            onClick={() => handleRegenerateShotSpeech(idx)}
                            disabled={isRegeneratingThisShot}
                            className="px-2.5 py-1 rounded text-[11px] font-medium bg-[#F27D26]/10 hover:bg-[#F27D26]/20 border border-[#F27D26]/30 text-[#F27D26] hover:text-[#ff9040] transition flex items-center gap-1 cursor-pointer"
                            title="Regenerar esta fala com IA"
                          >
                            <RefreshCw
                              className={`w-3 h-3 ${
                                isRegeneratingThisShot ? 'animate-spin text-[#F27D26]' : ''
                              }`}
                            />
                            <span>{isRegeneratingThisShot ? 'A gerar...' : 'Regenerar Fala'}</span>
                          </button>

                          {/* Adjustment Dropdown Toggle */}
                          <button
                            onClick={() => setOpenPromptShotIndex(isPromptOpen ? null : idx)}
                            className={`p-1 rounded transition border cursor-pointer ${
                              isPromptOpen
                                ? 'bg-white/20 border-white/30 text-white'
                                : 'bg-white/5 hover:bg-white/10 border-white/10 text-white/50 hover:text-white'
                            }`}
                            title="Opções avançadas de regeneração"
                          >
                            <ChevronDown
                              className={`w-3.5 h-3.5 transition-transform ${
                                isPromptOpen ? 'rotate-180' : ''
                              }`}
                            />
                          </button>
                        </div>
                      </div>

                      {/* Dropdown Options / Quick Prompt Chips Panel */}
                      {isPromptOpen && (
                        <div className="p-3 rounded-xl bg-black/80 border border-white/10 space-y-2.5 animate-in fade-in zoom-in-95">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-semibold text-white flex items-center gap-1">
                              <Wand2 className="w-3 h-3 text-[#F27D26]" />
                              Como queres ajustar a fala do Shot #{shot.shotNumber}?
                            </span>
                            <button
                              onClick={() => setOpenPromptShotIndex(null)}
                              className="text-white/40 hover:text-white"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Quick presets chips */}
                          <div className="flex flex-wrap gap-1.5">
                            {shot.shotNumber === 1 ? (
                              <>
                                <button
                                  onClick={() =>
                                    handleRegenerateShotSpeech(
                                      idx,
                                      'Gancho de curiosidade pura sobre biologia/hábito SEM convite de DM ou CTA.'
                                    )
                                  }
                                  className="px-2 py-1 rounded bg-white/5 hover:bg-[#F27D26]/20 border border-white/10 hover:border-[#F27D26]/40 text-[10px] text-white/80 hover:text-[#F27D26] cursor-pointer"
                                >
                                  🚫 Sem Call-to-Action / Sem DM
                                </button>
                                <button
                                  onClick={() =>
                                    handleRegenerateShotSpeech(
                                      idx,
                                      'Gancho focado em quebra de crença comum sobre cafeína/produtividade.'
                                    )
                                  }
                                  className="px-2 py-1 rounded bg-white/5 hover:bg-white/15 border border-white/10 text-[10px] text-white/80 cursor-pointer"
                                >
                                  🧠 Quebra de Paradigma
                                </button>
                                <button
                                  onClick={() =>
                                    handleRegenerateShotSpeech(
                                      idx,
                                      'Pergunta direta e intrigante nos primeiros 2 segundos.'
                                    )
                                  }
                                  className="px-2 py-1 rounded bg-white/5 hover:bg-white/15 border border-white/10 text-[10px] text-white/80 cursor-pointer"
                                >
                                  ❓ Pergunta Provocatória
                                </button>
                              </>
                            ) : shot.shotNumber === generatedScript.shots.length ? (
                              <>
                                <button
                                  onClick={() =>
                                    handleRegenerateShotSpeech(
                                      idx,
                                      'Chamada clara para enviar mensagem privada (DM) com a palavra FOCO para receber o guia.'
                                    )
                                  }
                                  className="px-2 py-1 rounded bg-white/5 hover:bg-emerald-500/20 border border-white/10 hover:border-emerald-500/40 text-[10px] text-white/80 hover:text-emerald-400 cursor-pointer"
                                >
                                  💬 Puxar para DM (Comenta / Envia)
                                </button>
                                <button
                                  onClick={() =>
                                    handleRegenerateShotSpeech(
                                      idx,
                                      'Pedir para guardar o post e partilhar sem vender nada.'
                                    )
                                  }
                                  className="px-2 py-1 rounded bg-white/5 hover:bg-blue-500/20 border border-white/10 hover:border-blue-500/40 text-[10px] text-white/80 hover:text-blue-400 cursor-pointer"
                                >
                                  📌 Guardar & Partilhar (Autoridade)
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() =>
                                    handleRegenerateShotSpeech(
                                      idx,
                                      'Mais curto, assertivo e com ritmo rápido de fala.'
                                    )
                                  }
                                  className="px-2 py-1 rounded bg-white/5 hover:bg-white/15 border border-white/10 text-[10px] text-white/80 cursor-pointer"
                                >
                                  ⚡ Mais Curto & Rápido
                                </button>
                                <button
                                  onClick={() =>
                                    handleRegenerateShotSpeech(
                                      idx,
                                      'Explicar o mecanismo biológico com termos simples do dia a dia.'
                                    )
                                  }
                                  className="px-2 py-1 rounded bg-white/5 hover:bg-white/15 border border-white/10 text-[10px] text-white/80 cursor-pointer"
                                >
                                  🔬 Mais Didático / Científico
                                </button>
                                <button
                                  onClick={() =>
                                    handleRegenerateShotSpeech(
                                      idx,
                                      'Tom muito autêntico e descontraído, como quem conversa com um amigo.'
                                    )
                                  }
                                  className="px-2 py-1 rounded bg-white/5 hover:bg-white/15 border border-white/10 text-[10px] text-white/80 cursor-pointer"
                                >
                                  ☕ Mais Conversacional & Informal
                                </button>
                              </>
                            )}
                          </div>

                          {/* Custom prompt input */}
                          <div className="flex gap-2 pt-1">
                            <input
                              type="text"
                              placeholder="Ou escreve a tua instrução (ex: retira a palavra 'café', fala em 'ondas cerebrais')..."
                              value={customShotPrompt}
                              onChange={(e) => setCustomShotPrompt(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && customShotPrompt.trim()) {
                                  handleRegenerateShotSpeech(idx, customShotPrompt.trim());
                                }
                              }}
                              className="grow bg-black border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-white/30 focus:outline-hidden focus:border-[#F27D26]"
                            />
                            <button
                              onClick={() => {
                                if (customShotPrompt.trim()) {
                                  handleRegenerateShotSpeech(idx, customShotPrompt.trim());
                                }
                              }}
                              disabled={!customShotPrompt.trim() || isRegeneratingThisShot}
                              className="px-3 py-1.5 rounded-lg bg-white text-black font-bold text-xs hover:bg-neutral-200 transition cursor-pointer shrink-0 disabled:opacity-40"
                            >
                              Aplicar
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Dialogue Content: Read Mode or Editable Textarea */}
                      {isEditingThisShot ? (
                        <div className="space-y-2 pt-1">
                          <label className="text-[10px] uppercase font-bold text-white/40 tracking-wider block">
                            Editar Diálogo Falado:
                          </label>
                          <textarea
                            rows={3}
                            value={editedSpeechText}
                            onChange={(e) => setEditedSpeechText(e.target.value)}
                            className="w-full bg-black border border-[#F27D26]/50 rounded-lg p-2.5 text-xs text-white focus:outline-hidden focus:border-[#F27D26] leading-relaxed"
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setEditingShotIndex(null)}
                              className="px-3 py-1 text-xs text-white/60 hover:text-white rounded bg-white/5 cursor-pointer"
                            >
                              Cancelar
                            </button>
                            <button
                              onClick={() => handleSaveEditedShot(idx)}
                              className="px-3 py-1 text-xs font-bold text-black bg-white hover:bg-neutral-200 rounded cursor-pointer"
                            >
                              Confirmar Frase
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-white font-medium pl-1 leading-relaxed">
                          <span className="text-white/40">Diálogo Falado: </span>
                          <span className="text-white">"{shot.spokenText}"</span>
                        </p>
                      )}

                      {/* Visual Direction & Camera Movement */}
                      <p className="text-[11px] text-white/60 pl-1">
                        <span className="text-white/40">Direção Visual: </span>
                        {shot.visualPrompt} ({shot.cameraMovement})
                      </p>

                      {shot.onScreenText && (
                        <div className="text-[10px] text-[#F27D26] font-mono bg-white/5 border border-white/10 px-2 py-0.5 rounded inline-block">
                          Legenda: {shot.onScreenText}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            generatedIdeas.length === 0 && (
              <div className="p-12 text-center border border-dashed border-white/10 rounded-2xl bg-[#0F0F0F] space-y-3">
                <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-[#F27D26]">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="text-base font-serif italic text-white">AI Creative Studio Pronto</h3>
                <p className="text-xs text-white/50 max-w-md mx-auto">
                  Seleciona primeiro um dos <strong>3 objetivos estratégicos</strong> acima, define o tema à esquerda e clica em <strong>"Gerar Ângulos & Ganchos"</strong>.
                </p>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};
