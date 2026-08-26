export type ContentChannel =
  | 'Instagram'
  | 'TikTok'
  | 'YouTube'
  | 'Facebook'
  | 'LinkedIn'
  | 'Paid Ads'
  | 'Twitter/X';

export type ContentType =
  | 'Reel'
  | 'Story'
  | 'Feed Post'
  | 'Carousel'
  | 'TikTok Video'
  | 'YouTube Short'
  | 'YouTube Long Video'
  | 'Advertisement';

export type CreativeFormat =
  | 'AI UGC'
  | 'Cinematic'
  | 'Product Video'
  | 'Faceless'
  | 'Talking Head'
  | 'Carousel';

export type CreativeObjective =
  | 'authority_educational'
  | 'indirect_lead_dm'
  | 'direct_sale_cta';

export type CreativePipelineStatus =
  | 'IDEA'
  | 'SCRIPT'
  | 'REVIEW'
  | 'APPROVED'
  | 'PRODUCTION'
  | 'EDITING'
  | 'READY'
  | 'PUBLISHED'
  | 'WINNER'
  | 'FAILED';

export interface ProductServiceItem {
  id: string;
  name: string;
  type: 'Product' | 'Service';
  description: string;
  usp: string;
  pricing?: string;
  heroHook?: string;
}

export interface BrandMemory {
  name: string;
  description: string;
  businessArea: string;
  targetAudience: {
    demographics: string;
    painPoints: string[];
    desires: string[];
  };
  positioning: string;
  communicationTone: {
    tone: string;
    styleGuide: string;
    dos: string[];
    donts: string[];
  };
  language: string;
  channels: ContentChannel[];
  visualIdentity: {
    primaryColor: string;
    accentColor: string;
    fontTitle: string;
    fontBody: string;
    logoUrl?: string;
    styleAesthetic: string;
  };
  products: ProductServiceItem[];
  differentiation: string;
  otherNotes: string;
}

export interface Character {
  id: string;
  name: string;
  role: string;
  ageGroup: string;
  personality: string;
  speakingStyle: string;
  visualTraits: string;
  referenceImageUrl: string;
  generatedPrompt?: string;
  shotCount?: number;
  createdAt: string;
}

export interface Shot {
  id: string;
  shotNumber: number;
  type: 'Hook' | 'Problem' | 'Development' | 'Solution' | 'CTA' | 'B-Roll' | 'Custom';
  durationSec: number;
  spokenText: string;
  visualPrompt: string;
  cameraMovement: string;
  characterEmotion: string;
  onScreenText?: string;
  videoUrl?: string;
  imageUrl?: string;
  audioUrl?: string;
  videoJobId?: string; // in-flight Fal.ai request_id while status === 'generating'
  status: 'draft' | 'generating' | 'ready' | 'needs_redo';
}

export interface PerformanceData {
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  retentionRatePct: number;
  ctrPct: number;
  conversions: number;
  roas?: number;
  recordedAt?: string;
  notes?: string;
}

export interface CreativeMemoryItem {
  id: string;
  creativeId?: string;
  date: string;
  type: 'hook' | 'script' | 'shot' | 'character' | 'cta' | 'angle' | 'winner' | 'failed';
  content: string;
  topic: string;
  channel?: ContentChannel;
  format?: CreativeFormat;
  characterName?: string;
  performanceSummary?: string;
  isWinner?: boolean;
}

export interface Creative {
  id: string;
  code: string; // e.g. #NOO-00127
  title: string;
  theme: string;
  topic: string;
  channel: ContentChannel;
  contentType: ContentType;
  creativeFormat: CreativeFormat;
  creativeObjective?: CreativeObjective;
  recipeId?: string;
  characterId?: string;
  status: CreativePipelineStatus;
  hook: string;
  scriptBody: string;
  cta: string;
  fullScriptText?: string;
  shots: Shot[];
  targetDuration: number;
  finalVideoUrl?: string;
  previewImageUrl?: string;
  tags: string[];
  performance?: PerformanceData;
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

export interface RecipeStep {
  stepNumber: number;
  name: string;
  description: string;
  provider: 'Gemini Omni / Fal.ai' | 'Gemini Script AI' | 'Fal.ai Wan/Kling' | 'Gemini TTS' | 'Vite Compositor';
  defaultDurationSec?: number;
  promptTemplate: string;
}

export interface Recipe {
  id: string;
  name: string;
  description: string;
  isCustom: boolean;
  iconName: string;
  estimatedDuration: string;
  inputRequirements: string[];
  steps: RecipeStep[];
}

export interface AIWinningPattern {
  category: string;
  finding: string;
  impact: string;
  confidenceScore: number;
}

export interface AIRecommendation {
  title: string;
  concept: string;
  expectedImpact: string;
  suggestedFormat: string;
}

export interface AIInsightReport {
  id: string;
  createdAt: string;
  summary: string;
  winningPatterns: AIWinningPattern[];
  recommendations: AIRecommendation[];
}

export interface AiGatewayConfig {
  textModel: string;
  videoModel: string;
  audioModel: string;
  byokKeys: {
    geminiApiKey?: string;
    falApiKey?: string;
    openaiApiKey?: string;
  };
}

export interface AIProviderConfig {
  defaultModel: string;
  falApiKey: string;
  openaiApiKey: string;
  preferredVideoEngine: 'gemini_omni' | 'fal_kling' | 'fal_wan' | 'fal_luma' | 'fal_minimax';
  voiceEngine: 'gemini_tts' | 'elevenlabs_sim';
  creditsAvailable: number;
  creditsUsed: number;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  codePrefix: string; // e.g. "NOO"
  createdAt: string;
  updatedAt: string;
  brandMemory: BrandMemory;
  creativeMemory: CreativeMemoryItem[];
  characters: Character[];
  creatives: Creative[];
  customRecipes: Recipe[];
  insights: AIInsightReport[];
  aiConfig: AIProviderConfig;
}
