import React, { useState, useEffect, useRef } from 'react';
import {
  Clapperboard,
  Play,
  Pause,
  RefreshCw,
  Sparkles,
  Layers,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Film,
  Volume2,
  VolumeX,
  Maximize2,
  Download,
  Plus,
  Trash2,
  ArrowRight,
  UserCheck,
  Zap,
} from 'lucide-react';
import { Project, Creative, Shot, Character, AiGatewayConfig } from '../types';
import { regenerateSingleShot, submitShotVideoGeneration, pollShotVideoGeneration } from '../lib/api';

const VIDEO_POLL_INTERVAL_MS = 5000;
const MAX_VIDEO_POLL_ATTEMPTS = 18; // ~90s at the interval above before giving up

interface ShotStudioProps {
  project: Project;
  aiGatewayConfig?: AiGatewayConfig;
  selectedCreative: Creative | null;
  onSelectCreative: (creative: Creative) => void;
  onUpdateCreative: (updated: Creative) => void;
  onOpenVideoPlayerModal: (creative: Creative) => void;
}

export const ShotStudio: React.FC<ShotStudioProps> = ({
  project,
  aiGatewayConfig,
  selectedCreative,
  onSelectCreative,
  onUpdateCreative,
  onOpenVideoPlayerModal,
}) => {
  const creatives = project.creatives || [];
  const activeCreative = selectedCreative || creatives[0] || null;

  // Selected shot inside timeline
  const [activeShotIndex, setActiveShotIndex] = useState<number>(0);
  const [isRegeneratingShot, setIsRegeneratingShot] = useState<boolean>(false);
  const [regenerateInstruction, setRegenerateInstruction] = useState<string>('');
  const [showRegenerateModal, setShowRegenerateModal] = useState<boolean>(false);

  // Real shot-video generation (Fal.ai) state
  const [isSubmittingVideoJob, setIsSubmittingVideoJob] = useState<boolean>(false);
  const [videoGenErrors, setVideoGenErrors] = useState<Record<string, string>>({});
  const pollAttemptsRef = useRef<Record<string, number>>({});

  // Video playback preview state
  const [isPlayingSequence, setIsPlayingSequence] = useState<boolean>(false);
  const [sequenceTime, setSequenceTime] = useState<number>(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [aspectRatio, setAspectRatio] = useState<'9:16' | '16:9' | '1:1'>('9:16');

  // Shot list
  const shots = activeCreative?.shots || [];
  const activeShot = shots[activeShotIndex] || shots[0] || null;
  const character = project.characters?.find((c) => c.id === activeCreative?.characterId);

  const totalDuration = shots.reduce((acc, s) => acc + (s.durationSec || 5), 0);

  // Playback timer effect for multi-shot timeline sequencer
  useEffect(() => {
    let interval: any;
    if (isPlayingSequence && totalDuration > 0) {
      interval = setInterval(() => {
        setSequenceTime((prev) => {
          if (prev >= totalDuration) {
            setIsPlayingSequence(false);
            return 0;
          }
          const next = prev + 0.1 * playbackSpeed;

          // Calculate which shot we are in
          let elapsed = 0;
          for (let i = 0; i < shots.length; i++) {
            elapsed += shots[i].durationSec || 5;
            if (next <= elapsed) {
              setActiveShotIndex(i);
              break;
            }
          }

          return next;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlayingSequence, totalDuration, playbackSpeed, shots]);

  // Keeps a ref to the freshest activeCreative so the polling effect below can merge its
  // updates against current data (e.g. a spokenText edit made while a video was generating)
  // instead of the stale creative object captured when the interval was created.
  const activeCreativeRef = useRef(activeCreative);
  useEffect(() => {
    activeCreativeRef.current = activeCreative;
  }, [activeCreative]);

  // Poll in-flight shot-video generation jobs. Restarts only when the set of in-flight
  // job ids actually changes (not on every unrelated edit). On a terminal result
  // (ready/needs_redo) for one or more shots in the same tick, all changes are merged into
  // a single onUpdateCreative call so simultaneous completions don't clobber each other.
  const inFlightJobsKey = shots
    .filter((s) => s.status === 'generating' && s.videoJobId)
    .map((s) => `${s.id}:${s.videoJobId}`)
    .join(',');

  useEffect(() => {
    const inFlight = shots.filter((s) => s.status === 'generating' && s.videoJobId);
    if (inFlight.length === 0) return;

    const interval = setInterval(async () => {
      const settled = await Promise.all(
        inFlight.map(async (shot) => {
          const jobId = shot.videoJobId!;
          pollAttemptsRef.current[jobId] = (pollAttemptsRef.current[jobId] || 0) + 1;
          if (pollAttemptsRef.current[jobId] > MAX_VIDEO_POLL_ATTEMPTS) {
            delete pollAttemptsRef.current[jobId];
            return { shotId: shot.id, status: 'needs_redo' as const, error: 'Video generation timed out.' };
          }
          try {
            const res = await pollShotVideoGeneration({ requestId: jobId, aiGatewayConfig });
            if (res.status === 'COMPLETED') {
              delete pollAttemptsRef.current[jobId];
              return { shotId: shot.id, status: 'ready' as const, videoUrl: res.videoUrl };
            }
            if (res.status === 'FAILED') {
              delete pollAttemptsRef.current[jobId];
              return { shotId: shot.id, status: 'needs_redo' as const, error: res.error || 'Video generation failed.' };
            }
            return null; // still IN_QUEUE / IN_PROGRESS
          } catch (err: any) {
            delete pollAttemptsRef.current[jobId];
            return { shotId: shot.id, status: 'needs_redo' as const, error: err.message || 'Polling failed.' };
          }
        })
      );

      const changes = settled.filter((c): c is NonNullable<typeof c> => c !== null);
      if (changes.length === 0) return;

      setVideoGenErrors((prev) => {
        const next = { ...prev };
        changes.forEach((c) => {
          if (c.error) next[c.shotId] = c.error;
          else delete next[c.shotId];
        });
        return next;
      });

      const latest = activeCreativeRef.current;
      if (!latest) return;
      const newShots = latest.shots.map((s) => {
        const change = changes.find((c) => c.shotId === s.id);
        if (!change) return s;
        return {
          ...s,
          status: change.status,
          videoUrl: change.status === 'ready' ? change.videoUrl : s.videoUrl,
          videoJobId: undefined,
        };
      });
      onUpdateCreative({ ...latest, shots: newShots, updatedAt: new Date().toISOString() });
    }, VIDEO_POLL_INTERVAL_MS);

    return () => clearInterval(interval);
    // Only the in-flight job set matters here — see inFlightJobsKey above.
  }, [inFlightJobsKey, aiGatewayConfig]);

  // Kick off real video generation for the active shot (Fal.ai Gemini Omni Flash). Separate
  // from handleRegenerateShot (text-only) — this one requires a character reference photo.
  const handleGenerateShotVideo = async () => {
    if (!activeCreative || !activeShot || !character?.referenceImageUrl) return;
    setIsSubmittingVideoJob(true);
    try {
      // Outfit is chosen per video (Creative), not per character, so the same character can
      // wear a different outfit in each video while staying consistent across every shot in
      // this one; background/environment defaults to the creative-level setting but can be
      // overridden per shot.
      const outfitBits: string[] = [];
      if (activeCreative.clothingColor || activeCreative.clothingType) {
        outfitBits.push(`wearing a ${[activeCreative.clothingColor, activeCreative.clothingType].filter(Boolean).join(' ')}`);
      }
      if (activeCreative.wearsSunglasses) {
        outfitBits.push('wearing sunglasses');
      }
      const outfitDescription = outfitBits.length > 0 ? ` ${character.name}, ${outfitBits.join(', ')}.` : '';

      const environment = activeShot.backgroundEnvironment?.trim() || activeCreative.defaultBackgroundEnvironment?.trim();
      const environmentDescription = environment ? ` Setting/background: ${environment}.` : '';

      // Non-negotiable: no background music, ever — only the character's spoken dialogue and
      // natural ambient sound (room tone), no music track under the voice.
      const noMusicInstruction = ' Audio: absolutely NO background music or soundtrack of any kind — only the character\'s spoken dialogue and natural ambient sound.';

      const prompt = `${activeShot.visualPrompt}.${outfitDescription}${environmentDescription} <IMAGE_REF_0> speaking: "${activeShot.spokenText}". Emotion: ${activeShot.characterEmotion}. Camera: ${activeShot.cameraMovement}.${noMusicInstruction}`;
      const { requestId } = await submitShotVideoGeneration({
        prompt,
        imageUrls: [character.referenceImageUrl],
        aspectRatio: '9:16',
        durationSec: activeShot.durationSec,
        aiGatewayConfig,
      });

      const newShots = [...activeCreative.shots];
      newShots[activeShotIndex] = { ...activeShot, status: 'generating', videoJobId: requestId };
      onUpdateCreative({ ...activeCreative, shots: newShots, updatedAt: new Date().toISOString() });
      setVideoGenErrors((prev) => {
        const next = { ...prev };
        delete next[activeShot.id];
        return next;
      });
    } catch (err: any) {
      setVideoGenErrors((prev) => ({ ...prev, [activeShot.id]: err.message || 'Failed to start video generation.' }));
    } finally {
      setIsSubmittingVideoJob(false);
    }
  };

  // Handle single shot regeneration
  const handleRegenerateShot = async () => {
    if (!activeCreative || !activeShot) return;
    setIsRegeneratingShot(true);
    try {
      const updatedShot = await regenerateSingleShot({
        brandMemory: project.brandMemory,
        character,
        shotNumber: activeShot.shotNumber,
        shotType: activeShot.type,
        previousSpokenText: activeShot.spokenText,
        instruction: regenerateInstruction,
        creativeObjective: activeCreative.creativeObjective,
        fullTitle: activeCreative.title,
        aiGatewayConfig,
      });

      const newShots = [...activeCreative.shots];
      newShots[activeShotIndex] = {
        ...updatedShot,
        imageUrl: character?.referenceImageUrl || activeShot.imageUrl,
        status: 'ready',
      };

      const updatedCreative: Creative = {
        ...activeCreative,
        shots: newShots,
        updatedAt: new Date().toISOString(),
      };

      onUpdateCreative(updatedCreative);
      setShowRegenerateModal(false);
      setRegenerateInstruction('');
    } finally {
      setIsRegeneratingShot(false);
    }
  };

  // Add a new blank shot
  const handleAddShot = () => {
    if (!activeCreative) return;
    const nextNum = shots.length + 1;
    const newShot: Shot = {
      id: 'shot-' + Date.now(),
      shotNumber: nextNum,
      type: nextNum === 1 ? 'Hook' : nextNum === 5 ? 'CTA' : 'Development',
      durationSec: 5,
      spokenText: 'Nova fala para este shot...',
      visualPrompt: `${character?.name || 'Criador'} falando para a câmara do telemóvel.`,
      cameraMovement: 'Câmara fixa com iluminação frontal.',
      characterEmotion: 'Natural e expressivo',
      onScreenText: 'Texto em destaque',
      imageUrl: character?.referenceImageUrl,
      status: 'ready',
    };

    const updatedCreative: Creative = {
      ...activeCreative,
      shots: [...shots, newShot],
    };
    onUpdateCreative(updatedCreative);
    setActiveShotIndex(shots.length);
  };

  // Delete shot
  const handleDeleteShot = (index: number) => {
    if (!activeCreative || shots.length <= 1) return;
    const newShots = shots.filter((_, i) => i !== index).map((s, idx) => ({ ...s, shotNumber: idx + 1 }));
    const updatedCreative: Creative = {
      ...activeCreative,
      shots: newShots,
    };
    onUpdateCreative(updatedCreative);
    setActiveShotIndex(Math.max(0, index - 1));
  };

  // Update shot field directly
  const handleUpdateShotField = (field: keyof Shot, value: any) => {
    if (!activeCreative || !activeShot) return;
    const newShots = [...shots];
    newShots[activeShotIndex] = {
      ...activeShot,
      [field]: value,
    };
    onUpdateCreative({
      ...activeCreative,
      shots: newShots,
    });
  };

  if (!activeCreative) {
    return (
      <div className="p-12 text-center border border-dashed border-zinc-800 rounded-xl bg-zinc-950/40 space-y-3">
        <Clapperboard className="w-10 h-10 text-zinc-500 mx-auto" />
        <h3 className="text-sm font-semibold text-white">No Creative Selected</h3>
        <p className="text-xs text-zinc-400">
          Create or choose a creative piece in the Studio or Pipeline to open the Multi-Shot Engine.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-white/5 border border-white/10 text-[#F27D26]">
            <Clapperboard className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-white/10 text-[#F27D26] font-bold">
                {activeCreative.code}
              </span>
              <h1 className="text-xl font-serif italic text-white tracking-tight truncate max-w-md">
                {activeCreative.title}
              </h1>
            </div>
            <p className="text-xs text-white/50 mt-0.5 flex items-center gap-2">
              <span>{activeCreative.channel}</span>
              <span>•</span>
              <span className="text-[#F27D26] font-medium">{activeCreative.creativeFormat}</span>
              <span>•</span>
              <span>Recipe: Gemini Omni UGC (Multi-Shot)</span>
            </p>
          </div>
        </div>

        {/* Creative selector dropdown & Rebuild action */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={activeCreative.id}
            onChange={(e) => {
              const target = creatives.find((c) => c.id === e.target.value);
              if (target) onSelectCreative(target);
            }}
            className="bg-black/60 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-hidden max-w-[200px] truncate"
          >
            {creatives.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} - {c.title}
              </option>
            ))}
          </select>

          <button
            onClick={() => onOpenVideoPlayerModal(activeCreative)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white hover:bg-neutral-200 text-black font-bold uppercase tracking-wider text-xs transition shadow-sm cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current text-[#F27D26]" />
            <span>Rebuild & Play Video</span>
          </button>
        </div>
      </div>

      {/* Main Studio Grid: Left is Character & Shot list; Right is Live Shot Preview Canvas & Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Anchor Character & Shot Timeline Cards (Col 5) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Character Anchor Card */}
          <div className="p-4 rounded-2xl bg-[#0F0F0F] border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              {character?.referenceImageUrl ? (
                <img
                  src={character.referenceImageUrl}
                  alt={character.name}
                  className="w-11 h-11 rounded-xl object-cover border border-[#F27D26]/40 shrink-0"
                />
              ) : (
                <div className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/50 font-bold text-sm shrink-0">
                  <UserCheck className="w-5 h-5" />
                </div>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white truncate">
                    {character ? character.name : 'No Anchor Character Assigned'}
                  </span>
                  <span className="text-[9px] uppercase tracking-wider bg-white/10 text-white/80 border border-white/10 px-1.5 py-0.5 rounded font-mono">
                    Anchor
                  </span>
                </div>
                <p className="text-[11px] text-white/50 line-clamp-1 mt-0.5">
                  {character ? character.visualTraits : 'Assign in Studio or Characters Tab.'}
                </p>
              </div>
            </div>
          </div>

          {/* Sequential Shots Timeline List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] uppercase tracking-widest opacity-40 font-bold text-white">
                Shot Sequence ({shots.length} shots • ~{totalDuration}s)
              </span>
              <button
                onClick={handleAddShot}
                className="flex items-center gap-1 text-[11px] text-[#F27D26] hover:text-white font-medium px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 transition cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Add Shot</span>
              </button>
            </div>

            <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
              {shots.map((shot, idx) => {
                const isActive = activeShotIndex === idx;
                return (
                  <div
                    key={shot.id || idx}
                    onClick={() => {
                      setActiveShotIndex(idx);
                      setIsPlayingSequence(false);
                    }}
                    className={`p-3.5 rounded-2xl border transition cursor-pointer space-y-2 relative ${
                      isActive
                        ? 'bg-[#141414] border-[#F27D26] shadow-lg ring-1 ring-[#F27D26]/30'
                        : 'bg-[#0F0F0F] border-white/10 hover:border-white/20'
                    }`}
                  >
                    {/* Shot Header */}
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-mono text-[10px] px-2 py-0.5 rounded font-bold ${
                            isActive
                              ? 'bg-[#F27D26] text-black'
                              : 'bg-white/10 text-white'
                          }`}
                        >
                          #{shot.shotNumber}
                        </span>
                        <span className="font-semibold text-white">{shot.type}</span>
                        <span className="text-[10px] text-white/40 font-mono">
                          ~{shot.durationSec}s
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[9px] uppercase tracking-wider px-2 py-0.5 rounded font-mono ${
                            shot.status === 'ready'
                              ? 'bg-white/10 text-white/90 border border-white/10'
                              : 'bg-amber-950/60 text-amber-300 border border-amber-800/40'
                          }`}
                        >
                          {shot.status === 'ready' ? 'Ready' : 'Draft'}
                        </span>
                        {shots.length > 1 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteShot(idx);
                            }}
                            className="text-white/40 hover:text-rose-400 p-0.5 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Dialogue preview */}
                    <p className="text-xs text-white/80 line-clamp-2">
                      <span className="text-white/40 font-medium">Dialogue: </span>
                      "{shot.spokenText}"
                    </p>

                    {/* Visual Prompt hint */}
                    <p className="text-[10px] text-white/40 line-clamp-1">
                      {shot.visualPrompt}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Shot Engine & Video Visualizer Canvas (Col 7) */}
        <div className="lg:col-span-7 space-y-4">
          {activeShot ? (
            <div className="p-6 rounded-2xl bg-[#0F0F0F] border border-white/10 space-y-4">
              {/* Top Shot Action Bar */}
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-serif italic text-white">
                      Shot #{activeShot.shotNumber} — {activeShot.type}
                    </span>
                    <span className="text-xs text-white/40 font-mono">
                      (~{activeShot.durationSec}s)
                    </span>
                  </div>
                  <span className="text-[11px] text-[#F27D26] font-medium">
                    Anchor: {character?.name || 'Default Model'} • Engine: Gemini Omni
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  {/* Generate Real Video Button (Fal.ai) */}
                  <button
                    onClick={handleGenerateShotVideo}
                    disabled={!character?.referenceImageUrl || isSubmittingVideoJob || activeShot.status === 'generating'}
                    title={!character?.referenceImageUrl ? 'Assign a character with a reference photo first' : undefined}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F27D26]/15 hover:bg-[#F27D26]/25 border border-[#F27D26]/30 text-[#F27D26] text-xs font-bold uppercase tracking-wider transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Film
                      className={`w-3.5 h-3.5 ${
                        isSubmittingVideoJob || activeShot.status === 'generating' ? 'animate-pulse' : ''
                      }`}
                    />
                    <span>
                      {activeShot.status === 'generating'
                        ? 'Generating…'
                        : activeShot.videoUrl
                        ? 'Regenerate Video'
                        : 'Generate Real Video'}
                    </span>
                  </button>

                  {/* Regenerate This Shot Button (text only) */}
                  <button
                    onClick={() => setShowRegenerateModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold uppercase tracking-wider transition cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-[#F27D26]" />
                    <span>Regenerate #{activeShot.shotNumber}</span>
                  </button>
                </div>
              </div>

              {videoGenErrors[activeShot.id] && (
                <div className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-rose-950/40 border border-rose-500/30 text-[11px] text-rose-300">
                  <span>{videoGenErrors[activeShot.id]}</span>
                  <button
                    onClick={handleGenerateShotVideo}
                    className="shrink-0 px-2.5 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 font-bold uppercase text-[10px] cursor-pointer"
                  >
                    Retry
                  </button>
                </div>
              )}

              {/* Shot Visualizer Canvas: a real <video> once generated, otherwise the
                  image+karaoke-text simulation (unchanged from before this shot has a
                  real video) */}
              <div className="relative rounded-2xl overflow-hidden bg-black border border-white/10 w-full max-w-[380px] aspect-[9/16] mx-auto flex items-center justify-center">
                {activeShot.videoUrl ? (
                  <video
                    key={activeShot.videoUrl}
                    src={activeShot.videoUrl}
                    controls
                    className="w-full h-full object-contain bg-black"
                  />
                ) : (
                  <>
                    {/* Background image / Anchor frame */}
                    <img
                      src={
                        activeShot.imageUrl ||
                        character?.referenceImageUrl ||
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80'
                      }
                      alt="Shot Frame"
                      className={`w-full h-full object-cover transition duration-700 ${
                        isPlayingSequence ? 'scale-105' : 'scale-100'
                      }`}
                    />

                    {/* Video overlay shade */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/40" />

                    {/* Top Badge: Shot and Camera tag */}
                    <div className="absolute top-3 left-3 flex items-center gap-2">
                      <span className="text-[9px] font-mono font-bold uppercase tracking-wider bg-black/70 backdrop-blur-md px-2 py-0.5 rounded text-white border border-white/10">
                        SHOT {activeShot.shotNumber} / {shots.length}
                      </span>
                      <span className="text-[9px] uppercase tracking-wider bg-white/10 backdrop-blur-md text-white/90 px-2 py-0.5 rounded border border-white/10">
                        {activeShot.cameraMovement}
                      </span>
                    </div>

                    {/* Center Speech Karaoke Subtitle simulation */}
                    <div className="absolute inset-x-6 bottom-14 text-center">
                      <div className="inline-block bg-black/85 backdrop-blur-md px-5 py-2.5 rounded-xl border border-white/10 max-w-lg shadow-2xl">
                        <p className="text-sm sm:text-base font-medium text-white tracking-wide leading-snug">
                          "{activeShot.spokenText}"
                        </p>
                        {activeShot.onScreenText && (
                          <span className="text-[11px] font-mono text-[#F27D26] block mt-1 font-semibold">
                            {activeShot.onScreenText}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Animated Speech Waveform Bar */}
                    <div className="absolute bottom-3 inset-x-4 flex items-center justify-between gap-3 text-xs text-white/70">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setIsPlayingSequence(!isPlayingSequence)}
                          className="p-2 rounded-full bg-white text-black hover:bg-neutral-200 transition cursor-pointer"
                        >
                          {isPlayingSequence ? (
                            <Pause className="w-3 h-3 fill-current" />
                          ) : (
                            <Play className="w-3 h-3 fill-current ml-0.5" />
                          )}
                        </button>
                        <span className="font-mono text-[11px] text-white/70">
                          {sequenceTime.toFixed(1)}s / {totalDuration.toFixed(1)}s
                        </span>
                      </div>

                      {/* Audio Wave Simulation */}
                      <div className="flex items-center gap-0.5 h-4">
                        {[12, 24, 16, 32, 20, 28, 14, 30, 22, 18, 26, 12].map((height, i) => (
                          <div
                            key={i}
                            className={`w-1 rounded-full bg-[#F27D26] transition-all duration-150 ${
                              isPlayingSequence ? 'animate-pulse' : 'opacity-30'
                            }`}
                            style={{ height: isPlayingSequence ? `${height}px` : '6px' }}
                          />
                        ))}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setIsMuted(!isMuted)}
                          className="text-white/50 hover:text-white cursor-pointer"
                        >
                          {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => onOpenVideoPlayerModal(activeCreative)}
                          className="text-white/50 hover:text-white cursor-pointer"
                          title="Full Screen Sequencer"
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {activeShot.status === 'generating' && (
                  <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                    <div className="flex items-center gap-2 text-white text-xs font-bold uppercase tracking-wider">
                      <RefreshCw className="w-4 h-4 animate-spin text-[#F27D26]" />
                      <span>Generating real video…</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Shot Dialogue & Visual Prompt Detailed Editors */}
              <div className="space-y-3 pt-1">
                <div>
                  <label className="text-[10px] uppercase tracking-widest opacity-40 font-bold block mb-1">
                    Spoken Dialogue & Script Line (5s speech)
                  </label>
                  <textarea
                    rows={2}
                    value={activeShot.spokenText}
                    onChange={(e) => handleUpdateShotField('spokenText', e.target.value)}
                    className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-hidden focus:border-[#F27D26]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] uppercase tracking-widest opacity-40 font-bold block mb-1">
                      Visual Direction & Prompt (Gemini Omni Anchor)
                    </label>
                    <input
                      type="text"
                      value={activeShot.visualPrompt}
                      onChange={(e) => handleUpdateShotField('visualPrompt', e.target.value)}
                      className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-hidden focus:border-[#F27D26]"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase tracking-widest opacity-40 font-bold block mb-1">
                      Camera Motion & Framing
                    </label>
                    <input
                      type="text"
                      value={activeShot.cameraMovement}
                      onChange={(e) => handleUpdateShotField('cameraMovement', e.target.value)}
                      className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-hidden focus:border-[#F27D26]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] uppercase tracking-widest opacity-40 font-bold block mb-1">
                      Character Emotion & Expression
                    </label>
                    <input
                      type="text"
                      value={activeShot.characterEmotion}
                      onChange={(e) => handleUpdateShotField('characterEmotion', e.target.value)}
                      className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-hidden focus:border-[#F27D26]"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase tracking-widest opacity-40 font-bold block mb-1">
                      On-Screen Text & Subtitle Stickers
                    </label>
                    <input
                      type="text"
                      value={activeShot.onScreenText || ''}
                      onChange={(e) => handleUpdateShotField('onScreenText', e.target.value)}
                      className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-hidden focus:border-[#F27D26]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-widest opacity-40 font-bold block mb-1">
                    Background / Environment (This Shot Only)
                  </label>
                  <input
                    type="text"
                    placeholder={
                      activeCreative.defaultBackgroundEnvironment
                        ? `Default: ${activeCreative.defaultBackgroundEnvironment}`
                        : 'Leave empty to keep the same background as the reference photo'
                    }
                    value={activeShot.backgroundEnvironment || ''}
                    onChange={(e) => handleUpdateShotField('backgroundEnvironment', e.target.value)}
                    className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-white/30 focus:outline-hidden focus:border-[#F27D26]"
                  />
                  <p className="text-[10px] text-white/40 mt-1">
                    Overrides the creative's default background just for this shot.
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Single Shot Regenerate Modal Popup */}
      {showRegenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#0F0F0F] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl p-6 text-white space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h3 className="text-base font-serif italic text-white flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-[#F27D26]" />
                <span>Regenerate Shot #{activeShot?.shotNumber} in Isolation</span>
              </h3>
              <button
                onClick={() => setShowRegenerateModal(false)}
                className="text-white/40 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-white/50">
              Only this individual 5-second scene will be rewritten and re-rendered. The rest of the video shots remain intact.
            </p>

            <div>
              <label className="text-[10px] uppercase tracking-widest opacity-40 font-bold block mb-1">
                Specific Direction / Adjustment for this Shot
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Make the hook more urgent and conversational; emphasize caffeine adenosine blockage..."
                value={regenerateInstruction}
                onChange={(e) => setRegenerateInstruction(e.target.value)}
                className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-hidden focus:border-[#F27D26]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowRegenerateModal(false)}
                className="px-4 py-2 rounded-lg border border-white/10 text-xs font-bold uppercase tracking-wider text-white/60 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRegenerateShot}
                disabled={isRegeneratingShot}
                className="px-5 py-2 rounded-lg bg-white hover:bg-neutral-200 text-black text-xs font-bold uppercase tracking-wider transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isRegeneratingShot ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#F27D26]" />
                    <span>Regenerating...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-[#F27D26]" />
                    <span>Generate Shot V2</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
