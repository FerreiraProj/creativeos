import { GoogleGenAI } from '@google/genai';

export const DEFAULT_TEXT_MODEL = 'gemini-3.6-flash';

// Fallback client using the server's own key.
const defaultAi = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Resolve which GoogleGenAI client + model to use for a given request: a per-request
// BYOK Gemini key (from the AI Gateway settings panel) takes priority over the server's
// own GEMINI_API_KEY, and a per-request model choice overrides the default.
export function resolveAi(body: any): { ai: GoogleGenAI; model: string } {
  const model = typeof body?.model === 'string' && body.model.trim() ? body.model.trim() : DEFAULT_TEXT_MODEL;
  const geminiApiKey = typeof body?.geminiApiKey === 'string' ? body.geminiApiKey.trim() : '';
  if (!geminiApiKey) {
    return { ai: defaultAi, model };
  }
  return {
    ai: new GoogleGenAI({
      apiKey: geminiApiKey,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
    }),
    model,
  };
}
