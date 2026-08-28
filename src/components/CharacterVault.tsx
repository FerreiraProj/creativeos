import React, { useState } from 'react';
import {
  Users,
  Plus,
  Trash2,
  Sparkles,
  Camera,
  MessageSquare,
  Eye,
  Check,
  Clapperboard,
  RefreshCw,
  UserCheck,
  X,
} from 'lucide-react';
import { Project, Character, AiGatewayConfig } from '../types';
import { generateCharacterPrompt, generateCharacterImage, uploadCharacterImage } from '../lib/api';

interface CharacterVaultProps {
  project: Project;
  aiGatewayConfig?: AiGatewayConfig;
  onUpdateCharacters: (characters: Character[]) => void;
}

export const CharacterVault: React.FC<CharacterVaultProps> = ({
  project,
  aiGatewayConfig,
  onUpdateCharacters,
}) => {
  const characters = project.characters || [];
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(
    characters[0] || null
  );

  // New/edited character state
  const [isCreating, setIsCreating] = useState(false);
  const [editingCharacterId, setEditingCharacterId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [ageGroup, setAgeGroup] = useState('');
  const [personality, setPersonality] = useState('');
  const [speakingStyle, setSpeakingStyle] = useState('');
  const [visualTraits, setVisualTraits] = useState('');
  const [referenceImageUrl, setReferenceImageUrl] = useState('');

  // AI-generated portrait state
  const [isWritingPrompt, setIsWritingPrompt] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [aiGenerateError, setAiGenerateError] = useState<string | null>(null);
  const [cachedPrompt, setCachedPrompt] = useState<{ masterPrompt: string; negativePrompt: string } | null>(null);
  const [aiGeneratedImageUrl, setAiGeneratedImageUrl] = useState<string | null>(null);

  // Attach-your-own-photo upload state
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Lightbox: click any character photo (list, detail view, AI preview) to view it full size
  const [lightboxImage, setLightboxImage] = useState<{ url: string; alt: string } | null>(null);

  // Sample portrait avatar presets
  const sampleAvatars = [
    {
      label: 'Sofia (Creator)',
      url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
    },
    {
      label: 'Marcus (Tech/Biohacker)',
      url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80',
    },
    {
      label: 'Elena (Founder)',
      url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&auto=format&fit=crop&q=80',
    },
    {
      label: 'David (Athlete/Fitness)',
      url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&auto=format&fit=crop&q=80',
    },
  ];

  const resetForm = () => {
    setEditingCharacterId(null);
    setName('');
    setRole('');
    setAgeGroup('');
    setPersonality('');
    setSpeakingStyle('');
    setVisualTraits('');
    setReferenceImageUrl('');
    setCachedPrompt(null);
    setAiGeneratedImageUrl(null);
    setAiGenerateError(null);
    setUploadError(null);
  };

  const handleStartCreate = () => {
    resetForm();
    setIsCreating(true);
  };

  const handleStartEdit = (char: Character) => {
    setEditingCharacterId(char.id);
    setName(char.name);
    setRole(char.role);
    setAgeGroup(char.ageGroup);
    setPersonality(char.personality);
    setSpeakingStyle(char.speakingStyle);
    setVisualTraits(char.visualTraits);
    setReferenceImageUrl(char.referenceImageUrl);
    setCachedPrompt(char.generatedPrompt ? { masterPrompt: char.generatedPrompt, negativePrompt: '' } : null);
    setAiGeneratedImageUrl(null);
    setAiGenerateError(null);
    setUploadError(null);
    setIsCreating(true);
  };

  const handleSubmitCharacterForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const existing = editingCharacterId ? characters.find((c) => c.id === editingCharacterId) : null;

    const charData: Character = {
      id: existing?.id || 'char-' + Date.now(),
      name: name.trim(),
      role: role.trim() || 'Content Creator & Brand Advocate',
      ageGroup: ageGroup.trim() || '26-32 anos',
      personality: personality.trim() || 'Autêntica, enérgica e direta.',
      speakingStyle: speakingStyle.trim() || 'Conversacional com contacto visual focado.',
      visualTraits: visualTraits.trim() || 'Casual clean, estética moderna de secretária.',
      referenceImageUrl:
        referenceImageUrl.trim() ||
        existing?.referenceImageUrl ||
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
      generatedPrompt: cachedPrompt?.masterPrompt || existing?.generatedPrompt,
      shotCount: existing?.shotCount || 0,
      createdAt: existing?.createdAt || new Date().toISOString(),
    };

    const updated = existing
      ? characters.map((c) => (c.id === charData.id ? charData : c))
      : [...characters, charData];

    onUpdateCharacters(updated);
    setSelectedCharacter(charData);
    setIsCreating(false);
    resetForm();
  };

  // Step 1: write a strong image-gen prompt from the form's own fields (Gemini), then
  // Step 2: render it into an actual portrait (Fal.ai flux/schnell). Cheap to re-run step 2
  // alone ("Regenerate Image") since the prompt is cached; "Rewrite Prompt" reruns both.
  const handleGenerateCharacterImage = async (rewritePrompt: boolean) => {
    setAiGenerateError(null);
    try {
      let prompt = cachedPrompt;
      if (rewritePrompt || !prompt) {
        setIsWritingPrompt(true);
        const written = await generateCharacterPrompt({
          characterName: name.trim() || 'New Character',
          description: [role, personality].filter(Boolean).join('. '),
          visualTraits,
          brandMemory: project.brandMemory,
          aiGatewayConfig,
        });
        prompt = { masterPrompt: written.masterPrompt, negativePrompt: written.negativePrompt };
        setCachedPrompt(prompt);
        setIsWritingPrompt(false);
      }

      setIsGeneratingImage(true);
      const { imageUrl } = await generateCharacterImage({
        prompt: prompt.masterPrompt,
        negativePrompt: prompt.negativePrompt,
        aiGatewayConfig,
      });
      setAiGeneratedImageUrl(imageUrl);
    } catch (err: any) {
      setAiGenerateError(err.message || 'Failed to generate character portrait.');
    } finally {
      setIsWritingPrompt(false);
      setIsGeneratingImage(false);
    }
  };

  const handleUseGeneratedImage = () => {
    if (aiGeneratedImageUrl) {
      setReferenceImageUrl(aiGeneratedImageUrl);
    }
  };

  // Attach an existing photo instead of generating one. Uploaded to Fal.ai's own storage
  // (not embedded as a data URI) so the result is a real, publicly-fetchable URL — needed
  // later when this character is used as the reference image for shot-video generation.
  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file later
    if (!file) return;

    setUploadError(null);
    setIsUploadingPhoto(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const { imageUrl } = await uploadCharacterImage({
          fileDataUrl: reader.result as string,
          aiGatewayConfig,
        });
        setReferenceImageUrl(imageUrl);
      } catch (err: any) {
        setUploadError(err.message || 'Failed to upload photo.');
      } finally {
        setIsUploadingPhoto(false);
      }
    };
    reader.onerror = () => {
      setUploadError('Failed to read the selected file.');
      setIsUploadingPhoto(false);
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteCharacter = (id: string) => {
    if (confirm('Delete this digital character profile?')) {
      const updated = characters.filter((c) => c.id !== id);
      onUpdateCharacters(updated);
      setSelectedCharacter(updated[0] || null);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-[#F27D26]">
              <Users className="w-4 h-4" />
            </span>
            <h1 className="text-xl font-serif italic text-white tracking-tight">
              Character Vault — {project.name}
            </h1>
          </div>
          <p className="text-xs text-white/50 mt-1">
            Manage your digital AI UGC creators and anchor reference photos to ensure 100% facial consistency across video shots.
          </p>
        </div>

        <button
          onClick={handleStartCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white hover:bg-neutral-200 text-black font-bold uppercase tracking-wider text-xs transition shadow-sm cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5] text-[#F27D26]" />
          <span>New Character</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Character Card Selector (Col 4) */}
        <div className="lg:col-span-4 space-y-3">
          <span className="text-[10px] uppercase tracking-widest opacity-40 font-bold text-white block px-1">
            Registered Characters ({characters.length})
          </span>

          {characters.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-white/10 rounded-2xl bg-[#0F0F0F]">
              <Users className="w-8 h-8 text-white/30 mx-auto mb-2" />
              <p className="text-xs text-white/50">No digital creators created yet.</p>
              <button
                onClick={handleStartCreate}
                className="mt-3 text-xs text-[#F27D26] hover:underline font-medium cursor-pointer"
              >
                + Create first character
              </button>
            </div>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {characters.map((char) => {
                const isSelected = selectedCharacter?.id === char.id;
                return (
                  <div
                    key={char.id}
                    onClick={() => {
                      setSelectedCharacter(char);
                      setIsCreating(false);
                    }}
                    className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-[#141414] border-[#F27D26] shadow-sm'
                        : 'bg-[#0F0F0F] border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setLightboxImage({ url: char.referenceImageUrl, alt: char.name });
                        }}
                        className="relative w-12 h-12 rounded-xl overflow-hidden border border-white/10 shrink-0 group cursor-zoom-in"
                        title="Click to enlarge"
                      >
                        <img
                          src={char.referenceImageUrl}
                          alt={char.name}
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute inset-0 bg-black/0 group-hover:bg-black/50 flex items-center justify-center transition">
                          <Eye className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition" />
                        </span>
                      </button>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-xs font-bold text-white truncate">{char.name}</h3>
                          {isSelected && (
                            <span className="w-1.5 h-1.5 rounded-full bg-[#F27D26] shrink-0" />
                          )}
                        </div>
                        <p className="text-[11px] text-white/50 truncate">{char.role}</p>
                        <span className="text-[10px] text-white/40 font-mono">
                          {char.shotCount || 0} shots produced
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCharacter(char.id);
                      }}
                      className="text-white/30 hover:text-rose-400 p-1.5 transition cursor-pointer"
                      title="Delete character"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Detailed Character Inspector / Creation Form (Col 8) */}
        <div className="lg:col-span-8">
          {isCreating ? (
            /* Creation / Edit Form */
            <form
              onSubmit={handleSubmitCharacterForm}
              className="p-6 rounded-2xl bg-[#0F0F0F] border border-white/10 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <h3 className="text-base font-serif italic text-white flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-[#F27D26]" />
                  <span>{editingCharacterId ? 'Edit Digital Character Anchor' : 'Create Digital Character Anchor'}</span>
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreating(false);
                    resetForm();
                  }}
                  className="text-xs text-white/40 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              {/* Sample Avatar Picker */}
              <div>
                <label className="text-[10px] uppercase tracking-widest opacity-40 font-bold block mb-1.5">
                  Choose Photo Reference Preset (or attach/paste your own below)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {sampleAvatars.map((ava, i) => (
                    <div
                      key={i}
                      onClick={() => {
                        setReferenceImageUrl(ava.url);
                        if (!name) setName(ava.label.split(' ')[0]);
                      }}
                      className={`p-2.5 rounded-xl border cursor-pointer transition flex items-center gap-2 ${
                        referenceImageUrl === ava.url
                          ? 'bg-[#141414] border-[#F27D26]'
                          : 'bg-black/40 border-white/10 hover:border-white/20'
                      }`}
                    >
                      <img
                        src={ava.url}
                        alt={ava.label}
                        className="w-8 h-8 rounded-lg object-cover shrink-0"
                      />
                      <span className="text-[11px] text-white/80 font-medium truncate">
                        {ava.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Attach Your Own Photo */}
              <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <label className="text-[10px] uppercase tracking-widest opacity-40 font-bold flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-[#F27D26]" />
                    <span>Attach Your Own Photo</span>
                  </label>
                  <label
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold uppercase tracking-wider transition cursor-pointer ${
                      isUploadingPhoto ? 'opacity-50 pointer-events-none' : ''
                    }`}
                  >
                    <RefreshCw className={`w-3 h-3 text-[#F27D26] ${isUploadingPhoto ? 'animate-spin' : ''}`} />
                    <span>{isUploadingPhoto ? 'Uploading…' : 'Choose File'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelected}
                      disabled={isUploadingPhoto}
                      className="hidden"
                    />
                  </label>
                </div>
                <p className="text-[10px] text-white/40">
                  Upload an existing photo of this character instead of generating one.
                </p>
                {uploadError && (
                  <p className="text-[11px] text-rose-400 bg-rose-950/30 border border-rose-500/20 rounded-lg px-2.5 py-1.5">
                    {uploadError}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label className="text-[10px] uppercase tracking-widest opacity-40 font-bold block mb-1">
                    Character Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sofia, Marcus, Alex"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-hidden focus:border-[#F27D26]"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-[10px] uppercase tracking-widest opacity-40 font-bold block mb-1">
                    Creator Role & Persona
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Productivity Specialist, Biohacker, Daily User"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-hidden focus:border-[#F27D26]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase tracking-widest opacity-40 font-bold block mb-1">
                    Speaking Style & Cadence
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Fast, conversational, friendly and relatable"
                    value={speakingStyle}
                    onChange={(e) => setSpeakingStyle(e.target.value)}
                    className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-hidden focus:border-[#F27D26]"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest opacity-40 font-bold block mb-1">
                    Personality Traits
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Curious, confident, empathetic, witty"
                    value={personality}
                    onChange={(e) => setPersonality(e.target.value)}
                    className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-hidden focus:border-[#F27D26]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-widest opacity-40 font-bold block mb-1">
                  Visual Traits (Used in Gemini Omni Prompts)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Wavy brunette hair, casual streetwear hoodie, natural desk setup with laptop, warm daylight lighting."
                  value={visualTraits}
                  onChange={(e) => setVisualTraits(e.target.value)}
                  className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-hidden focus:border-[#F27D26]"
                />
              </div>

              <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] uppercase tracking-widest text-[#F27D26] font-bold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generate Reference Photo with AI</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => handleGenerateCharacterImage(false)}
                    disabled={isWritingPrompt || isGeneratingImage}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold uppercase tracking-wider transition cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3 h-3 text-[#F27D26] ${isWritingPrompt || isGeneratingImage ? 'animate-spin' : ''}`} />
                    <span>
                      {isWritingPrompt ? 'Writing Prompt…' : isGeneratingImage ? 'Rendering…' : cachedPrompt ? 'Regenerate Image' : 'Generate with AI'}
                    </span>
                  </button>
                </div>
                <p className="text-[10px] text-white/40">
                  Uses the name/role/personality/visual traits above to write a prompt (Gemini), then renders a portrait (Fal.ai).
                </p>

                {aiGenerateError && (
                  <p className="text-[11px] text-rose-400 bg-rose-950/30 border border-rose-500/20 rounded-lg px-2.5 py-1.5">
                    {aiGenerateError}
                  </p>
                )}

                {aiGeneratedImageUrl && (
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setLightboxImage({ url: aiGeneratedImageUrl, alt: 'AI-generated character portrait' })
                      }
                      className="relative w-16 h-16 rounded-xl overflow-hidden border border-[#F27D26]/40 shrink-0 group cursor-zoom-in"
                      title="Click to enlarge"
                    >
                      <img
                        src={aiGeneratedImageUrl}
                        alt="AI-generated character portrait"
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute inset-0 bg-black/0 group-hover:bg-black/50 flex items-center justify-center transition">
                        <Eye className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition" />
                      </span>
                    </button>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={handleUseGeneratedImage}
                        className="flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 transition cursor-pointer"
                      >
                        <Check className="w-3 h-3" />
                        <span>Use This Photo</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleGenerateCharacterImage(true)}
                        disabled={isWritingPrompt || isGeneratingImage}
                        className="px-2.5 py-1 rounded text-[10px] font-medium bg-white/5 hover:bg-white/10 text-white/70 border border-white/10 transition cursor-pointer disabled:opacity-50"
                      >
                        Rewrite Prompt
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-widest opacity-40 font-bold block mb-1">
                  Reference Photo Image URL
                </label>
                <div className="flex items-center gap-3">
                  {referenceImageUrl && (
                    <button
                      type="button"
                      onClick={() => setLightboxImage({ url: referenceImageUrl, alt: 'Reference photo preview' })}
                      className="relative w-12 h-12 rounded-lg overflow-hidden border border-white/10 shrink-0 group cursor-zoom-in"
                      title="Click to enlarge"
                    >
                      <img src={referenceImageUrl} alt="Reference photo preview" className="w-full h-full object-cover" />
                      <span className="absolute inset-0 bg-black/0 group-hover:bg-black/50 flex items-center justify-center transition">
                        <Eye className="w-3.5 h-3.5 text-white opacity-0 group-hover:opacity-100 transition" />
                      </span>
                    </button>
                  )}
                  <input
                    type="url"
                    placeholder="https://..."
                    value={referenceImageUrl}
                    onChange={(e) => setReferenceImageUrl(e.target.value)}
                    className="flex-1 bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-hidden focus:border-[#F27D26]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreating(false);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-white/10 text-xs font-bold uppercase tracking-wider text-white/60 rounded-lg hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-white text-black text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-neutral-200 transition cursor-pointer"
                >
                  {editingCharacterId ? 'Save Changes' : 'Save Character Anchor'}
                </button>
              </div>
            </form>
          ) : selectedCharacter ? (
            /* Selected Character View */
            <div className="p-6 rounded-2xl bg-[#0F0F0F] border border-white/10 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-white/10">
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() =>
                      setLightboxImage({ url: selectedCharacter.referenceImageUrl, alt: selectedCharacter.name })
                    }
                    className="relative w-20 h-20 rounded-2xl overflow-hidden border border-[#F27D26]/50 shadow-md shrink-0 group cursor-zoom-in"
                    title="Click to enlarge"
                  >
                    <img
                      src={selectedCharacter.referenceImageUrl}
                      alt={selectedCharacter.name}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute inset-0 bg-black/0 group-hover:bg-black/50 flex items-center justify-center transition">
                      <Eye className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition" />
                    </span>
                  </button>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-serif italic text-white">{selectedCharacter.name}</h2>
                      <span className="text-[9px] uppercase tracking-wider bg-white/10 text-white/80 border border-white/10 px-2 py-0.5 rounded font-mono">
                        Active Anchor
                      </span>
                    </div>
                    <p className="text-xs text-white/70 mt-0.5">{selectedCharacter.role}</p>
                    <span className="text-[11px] text-white/40 mt-1 block">
                      Age group: {selectedCharacter.ageGroup || '25-35'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleStartEdit(selectedCharacter)}
                    className="text-xs font-bold uppercase tracking-wider text-[#F27D26] hover:text-white px-4 py-2 rounded-lg bg-[#F27D26]/10 border border-[#F27D26]/30 transition cursor-pointer"
                  >
                    Edit
                  </button>
                  <button
                    onClick={handleStartCreate}
                    className="text-xs font-bold uppercase tracking-wider text-white/60 hover:text-white px-4 py-2 rounded-lg bg-white/5 border border-white/10 transition cursor-pointer"
                  >
                    Create Another
                  </button>
                </div>
              </div>

              {/* Character Attributes Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-black/60 border border-white/5 space-y-1">
                  <span className="text-[10px] uppercase tracking-widest opacity-40 font-bold text-white">
                    Speaking Style & Cadence
                  </span>
                  <p className="text-xs text-white/80">{selectedCharacter.speakingStyle}</p>
                </div>

                <div className="p-4 rounded-xl bg-black/60 border border-white/5 space-y-1">
                  <span className="text-[10px] uppercase tracking-widest opacity-40 font-bold text-white">
                    Personality
                  </span>
                  <p className="text-xs text-white/80">{selectedCharacter.personality}</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-black/60 border border-white/5 space-y-2">
                <span className="text-[10px] uppercase tracking-widest text-[#F27D26] font-bold">
                  Visual Prompt Reference Anchor
                </span>
                <p className="text-xs text-white/80 font-mono bg-black/40 p-3 rounded-lg border border-white/5">
                  {selectedCharacter.visualTraits}
                </p>
                <p className="text-[10px] text-white/40">
                  This anchor description is automatically bound into Gemini Omni shot generation calls.
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Photo Lightbox */}
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
