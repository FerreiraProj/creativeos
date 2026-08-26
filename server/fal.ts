import { createFalClient, type FalClient } from '@fal-ai/client';

// Only engine wired up this phase (see plan) — the AI Gateway UI still lists 3 other
// video-model options, but they're disabled/"Coming soon" until implemented.
export const FAL_IMAGE_MODEL = 'fal-ai/flux-1/schnell';
export const FAL_VIDEO_MODEL = 'google/gemini-omni-flash/reference-to-video';

const defaultFal = createFalClient({ credentials: process.env.FAL_API_KEY });

// Per-request client so a user-supplied BYOK key never leaks across requests — safe here
// since createFalClient() returns an independent instance (verified against the installed
// package's types), unlike the older fal.config()-mutates-a-singleton pattern.
export function resolveFal(body: any): FalClient {
  const falApiKey = typeof body?.falApiKey === 'string' ? body.falApiKey.trim() : '';
  if (!falApiKey) return defaultFal;
  return createFalClient({ credentials: falApiKey });
}
