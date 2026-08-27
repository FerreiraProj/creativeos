// Server-side project creation/duplication defaults. Ported from the previous client-side
// src/lib/storage.ts (which used to own this logic before persistence moved to Postgres).

export function createBlankBrandMemory(name: string) {
  return {
    name,
    description: '',
    businessArea: '',
    targetAudience: {
      demographics: '',
      painPoints: [],
      desires: [],
    },
    positioning: '',
    communicationTone: {
      tone: '',
      styleGuide: '',
      dos: [],
      donts: [],
    },
    language: 'Português (ou Inglês)',
    channels: ['Instagram', 'TikTok', 'YouTube', 'Paid Ads'],
    visualIdentity: {
      primaryColor: '#0F172A',
      accentColor: '#3B82F6',
      fontTitle: 'Plus Jakarta Sans',
      fontBody: 'Inter',
      logoUrl: '',
      styleAesthetic: 'Clean, moderno, autêntico e focado em retenção',
    },
    products: [],
    differentiation: '',
    otherNotes: '',
  };
}

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
}

export function buildNewProject(name: string, description: string, codePrefix?: string) {
  const prefix = codePrefix || name.trim().slice(0, 3).toUpperCase() || 'PRJ';
  const now = new Date().toISOString();
  return {
    id: generateId('proj'),
    name,
    description,
    codePrefix: prefix,
    createdAt: now,
    updatedAt: now,
    brandMemory: createBlankBrandMemory(name),
    creativeMemory: [],
    characters: [],
    creatives: [],
    customRecipes: [],
    insights: [],
    aiConfig: {
      defaultModel: 'gemini-3.6-flash',
      falApiKey: '',
      openaiApiKey: '',
      preferredVideoEngine: 'gemini_omni',
      voiceEngine: 'gemini_tts',
      creditsAvailable: 2500,
      creditsUsed: 0,
    },
  };
}

export function buildDuplicateProject(source: any, newName: string, newPrefix: string) {
  const now = new Date().toISOString();
  return {
    id: generateId('proj'),
    name: newName,
    description: `Estrutura baseada em ${source.name}`,
    codePrefix: newPrefix.toUpperCase(),
    createdAt: now,
    updatedAt: now,
    brandMemory: {
      ...createBlankBrandMemory(newName),
      channels: [...source.brandMemory.channels],
      visualIdentity: { ...source.brandMemory.visualIdentity },
    },
    creativeMemory: [],
    characters: [],
    creatives: [],
    customRecipes: [...(source.customRecipes || [])],
    insights: [],
    aiConfig: {
      ...source.aiConfig,
      creditsUsed: 0,
    },
  };
}
