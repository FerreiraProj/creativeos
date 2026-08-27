import { Router } from 'express';
import { GoogleGenAI, Type } from '@google/genai';

const router = Router();

const DEFAULT_TEXT_MODEL = 'gemini-3.6-flash';

// Initialize GoogleGenAI SDK server-side (fallback client using the server's own key).
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
function resolveAi(body: any): { ai: GoogleGenAI; model: string } {
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

// Endpoint: AI Creative Strategist & Idea Generator
router.post('/ideas', async (req, res) => {
  try {
    const { brandMemory, creativeMemory, topic, count = 5, channel, format, creativeObjective } = req.body;
    const { ai, model } = resolveAi(req.body);

    let objectiveInstruction = '';
    if (creativeObjective === 'authority_educational') {
      objectiveInstruction = `CRITICAL OBJECTIVE: INFORMATIVO & DIDÁTICO (GANHAR AUTORIDADE - SEM VENDA).
- Do NOT sell any product or push an offer.
- Focus 100% on pure educational value, bust common myths, explain biological/logical mechanisms, and establish deep authority & trust in the subject.
- Hooks should sound like an expert sharing a genuine breakthrough, research finding, or counter-intuitive insight.`;
    } else if (creativeObjective === 'indirect_lead_dm') {
      objectiveInstruction = `CRITICAL OBJECTIVE: VENDA INDIRETA (PUXAR PARA DM / DIRECT MESSAGE).
- Generate high curiosity, share 80% of the solution/strategy and invite viewers to send a Direct Message (DM) or comment a trigger word (e.g., 'FOCO', 'PROTOCOLO', 'GUIA') to receive the full step-by-step or chat 1-on-1.
- Hooks should be intriguing, relational, and spark conversation.`;
    } else if (creativeObjective === 'direct_sale_cta') {
      objectiveInstruction = `CRITICAL OBJECTIVE: VENDA DIRETA (CALL TO ACTION / CONVERSÃO IMEDIATA).
- High-converting direct response format.
- Agitate painful problem, introduce the brand/product as the specific solution, handle objections, and end with an immediate call to buy/click link in bio.`;
    }

    const prompt = `You are a world-class Creative Strategist for short-form & viral advertising.
Brand context:
${JSON.stringify(brandMemory, null, 2)}

Past creative memory (hooks that worked, themes, past winners):
${JSON.stringify(creativeMemory?.slice(0, 10) || [], null, 2)}

Topic or Angle: ${topic || 'High-converting viral concepts'}
Target Channel: ${channel || 'Instagram Reel / TikTok'}
Creative Format: ${format || 'AI UGC'}
Selected Creative Objective: ${creativeObjective || 'direct_sale_cta'}
${objectiveInstruction}
Count: ${count}

Generate ${count} distinct, high-impact creative ideas strictly aligned with the selected objective. For each idea provide:
- title
- theme
- angle
- hookIdea (the first 3-second hook)
- visualHook (what viewers see in first 2 seconds)
- targetEmotion (e.g., curiosity, shock, FOMO, relief, authority)
- recommendedFormat (e.g. AI UGC Talking Head, Cinematic, Faceless)
- whyItWorks (creative psychology)

Return valid JSON with an array of objects.`;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              theme: { type: Type.STRING },
              angle: { type: Type.STRING },
              hookIdea: { type: Type.STRING },
              visualHook: { type: Type.STRING },
              targetEmotion: { type: Type.STRING },
              recommendedFormat: { type: Type.STRING },
              whyItWorks: { type: Type.STRING },
            },
            required: ['title', 'theme', 'angle', 'hookIdea', 'visualHook', 'targetEmotion', 'recommendedFormat', 'whyItWorks'],
          },
        },
      },
    });

    const text = response.text || '[]';
    res.json({ success: true, ideas: JSON.parse(text) });
  } catch (error: any) {
    console.error('Error generating ideas:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to generate ideas' });
  }
});

// Endpoint: AI Script Writer (Multi-Shot Breakdown)
router.post('/script', async (req, res) => {
  try {
    const { brandMemory, creativeMemory, idea, character, channel, format, targetDuration = 25, creativeObjective } = req.body;
    const { ai, model } = resolveAi(req.body);

    let scriptObjectiveGuide = '';
    if (creativeObjective === 'authority_educational') {
      scriptObjectiveGuide = `CRITICAL OBJECTIVE: INFORMATIVO & DIDÁTICO (GANHAR AUTORIDADE - SEM VENDA).
- DO NOT sell or mention purchasing the product. Do not pitch discounts or store links.
- The script must purely deliver deep insight, explain biological/practical mechanisms, bust myths, and provide actionable tips.
- The CTA shot must invite the viewer to SAVE this post, SHARE with someone who needs it, FOLLOW for more insights, or reflect on their daily habits.`;
    } else if (creativeObjective === 'indirect_lead_dm') {
      scriptObjectiveGuide = `CRITICAL OBJECTIVE: VENDA INDIRETA (PUXAR PARA DM / DIRECT MESSAGE).
- The script should present an intriguing breakdown or story (80% value) and hold back the full framework/checklist for 1-on-1 direct message interaction.
- The CTA shot MUST explicitly call the viewer to send a DM with a keyword (e.g. 'Envia "FOCO" por mensagem privada', 'Comenta "PROTOCOLO" que eu envio-te o PDF no direct') to start a personal conversation before sharing the product link.`;
    } else if (creativeObjective === 'direct_sale_cta') {
      scriptObjectiveGuide = `CRITICAL OBJECTIVE: VENDA DIRETA (CALL TO ACTION / CONVERSÃO IMEDIATA).
- High-converting direct response format. Hook -> Problem Agitation -> Solution Introduction (${brandMemory?.name || 'Product'}) -> Overcoming Objections -> Strong direct purchase CTA ('Clica no link da bio', 'Garante o teu frasco com desconto').`;
    }

    const prompt = `You are a premier direct-response Creative Director & Scriptwriter.
Write an authentic, punchy, high-retention short-form video script designed for AI UGC or Short-Form Video.

Brand Context:
${JSON.stringify(brandMemory, null, 2)}

Selected Objective:
${creativeObjective || 'direct_sale_cta'}
${scriptObjectiveGuide}

CRITICAL SEQUENCING RULES:
1. Shot 1 (Hook - 0 to 3 seconds) MUST STOP the scroll with curiosity, relatable pain, or an unexpected insight. Shot 1 MUST NEVER include the Call to Action (CTA) such as "Comenta...", "Envia DM...", or "Clica no link".
2. Shots 2-4 build context, problem agitation, and the revelation/solution.
3. The Call to Action (CTA) / DM prompt / Purchase link / Save instruction MUST ONLY appear in the final Shot (Shot 5 / CTA).

CRITICAL LANGUAGE RULE: When explaining a biological, scientific, or physiological mechanism (e.g., receptors, neurotransmitters, hormones, enzymes), always describe it in simple, everyday conversational language — the way a relatable creator would explain it to a friend — never in clinical, pharmacological, or medical-textbook terminology. For example, prefer "engana o teu cérebro para não sentires o cansaço" over "bloqueia os recetores de adenosina". This keeps the authentic UGC voice AND avoids overly clinical phrasing that can be misread as medical/pharmaceutical claims when the shot is later turned into an AI-generated video.

Idea / Angle:
${JSON.stringify(idea, null, 2)}

Character Profile:
${character ? JSON.stringify(character, null, 2) : 'Default authentic creator'}

Target Duration: ~${targetDuration} seconds (split into ~5-second independent shots).
Language: ${brandMemory?.language || 'Portuguese (Portugal / International) or match project prompt'}

Structure requirements:
1. Break down into 4 to 6 sequential shots (each exactly ~4-6 seconds).
2. Each shot must have:
   - shotNumber (1, 2, 3...)
   - type (Hook, Problem, Build-up, Solution, CTA)
   - durationSec (~5)
   - spokenText (natural, spoken dialogue, conversational rhythm)
   - visualPrompt (exact prompt for video/image generation with Fal.ai / Gemini Omni, keeping character visual consistency)
   - cameraMovement (e.g., Close-up direct to camera, slight zoom, holding product, lifestyle B-roll)
   - characterEmotion (e.g., intrigued, relatable frustration, confident recommendation)
   - onScreenText (captions/stickers)

Also return:
- fullTitle
- overallHook
- mainCta (aligned strictly with the selected Creative Objective)
- estimatedTotalDuration`;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            fullTitle: { type: Type.STRING },
            overallHook: { type: Type.STRING },
            mainCta: { type: Type.STRING },
            estimatedTotalDuration: { type: Type.NUMBER },
            shots: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  shotNumber: { type: Type.INTEGER },
                  type: { type: Type.STRING },
                  durationSec: { type: Type.NUMBER },
                  spokenText: { type: Type.STRING },
                  visualPrompt: { type: Type.STRING },
                  cameraMovement: { type: Type.STRING },
                  characterEmotion: { type: Type.STRING },
                  onScreenText: { type: Type.STRING },
                },
                required: ['shotNumber', 'type', 'durationSec', 'spokenText', 'visualPrompt', 'cameraMovement', 'characterEmotion'],
              },
            },
          },
          required: ['fullTitle', 'overallHook', 'mainCta', 'estimatedTotalDuration', 'shots'],
        },
      },
    });

    const text = response.text || '{}';
    res.json({ success: true, script: JSON.parse(text) });
  } catch (error: any) {
    console.error('Error generating script:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to generate script' });
  }
});

// Endpoint: Regenerate Single Shot Speech / Content
router.post('/regenerate-shot', async (req, res) => {
  try {
    const { brandMemory, character, shotNumber, shotType, previousSpokenText, instruction, creativeObjective, fullTitle } = req.body;
    const { ai, model } = resolveAi(req.body);

    let shotGuide = '';
    if (shotNumber === 1 || shotType?.toLowerCase() === 'hook') {
      shotGuide = `CRITICAL FOR SHOT 1 (HOOK):
- This is the opening 0-3s hook to stop the scroll.
- DO NOT INCLUDE ANY CALL TO ACTION (no "Comenta...", no "Manda DM...", no "Clica no link").
- Focus on strong pattern-interrupt, provocative question, surprising statement, or immediate relatability.`;
    } else if (shotType?.toLowerCase() === 'cta' || shotNumber >= 5) {
      if (creativeObjective === 'authority_educational') {
        shotGuide = `CTA OBJECTIVE: Ask viewer to SAVE this post, SHARE with someone who needs it, or FOLLOW for more. Zero sales pitch.`;
      } else if (creativeObjective === 'indirect_lead_dm') {
        shotGuide = `CTA OBJECTIVE: Direct viewer to send a DM (or comment) with a specific keyword like "FOCO", "PROTOCOLO", or "GUIA" to receive the guide privately.`;
      } else {
        shotGuide = `CTA OBJECTIVE: Direct purchase CTA ("Clica no link da bio", "Garante o teu frasco").`;
      }
    } else {
      shotGuide = `SHOT TYPE ${shotType}: Deliver clear, conversational value, progression, and natural flow without prematurely calling for action.`;
    }

    const prompt = `You are a premier short-form video script doctor. Regenerate ONLY the spoken dialogue and details for a single video shot.
Context:
- Video Title: ${fullTitle || 'Short-Form Video'}
- Shot Number: ${shotNumber} (${shotType})
- Previous Spoken Text to replace: "${previousSpokenText}"
- Specific User Request: "${instruction || 'Make it punchier, conversational, natural, and distinct from previous'}"
- Objective: ${creativeObjective || 'direct_sale_cta'}
- Character: ${character?.name || 'Creator'} (${character?.personality || 'Authentic & relatable'})
- Language: ${brandMemory?.language || 'Portuguese (Portugal / International)'}

${shotGuide}

CRITICAL LANGUAGE RULE: When explaining a biological, scientific, or physiological mechanism (e.g., receptors, neurotransmitters, hormones, enzymes), always describe it in simple, everyday conversational language — the way a relatable creator would explain it to a friend — never in clinical, pharmacological, or medical-textbook terminology. For example, prefer "engana o teu cérebro para não sentires o cansaço" over "bloqueia os recetores de adenosina". This keeps the authentic UGC voice AND avoids overly clinical phrasing that can be misread as medical/pharmaceutical claims when the shot is later turned into an AI-generated video.

Provide an updated shot object with:
- shotNumber (${shotNumber})
- type (${shotType})
- durationSec (~5)
- spokenText (new alternative dialogue)
- visualPrompt (updated visual prompt)
- cameraMovement
- characterEmotion
- onScreenText (matching short text caption)`;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            shotNumber: { type: Type.INTEGER },
            type: { type: Type.STRING },
            durationSec: { type: Type.NUMBER },
            spokenText: { type: Type.STRING },
            visualPrompt: { type: Type.STRING },
            cameraMovement: { type: Type.STRING },
            characterEmotion: { type: Type.STRING },
            onScreenText: { type: Type.STRING },
          },
          required: ['shotNumber', 'type', 'durationSec', 'spokenText', 'visualPrompt', 'cameraMovement', 'characterEmotion'],
        },
      },
    });

    const text = response.text || '{}';
    res.json({ success: true, shot: JSON.parse(text) });
  } catch (error: any) {
    console.error('Error regenerating shot:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to regenerate shot' });
  }
});

// Endpoint: Query Creative Memory & Intelligence
router.post('/creative-memory-query', async (req, res) => {
  try {
    const { query, brandMemory, creativeMemory, performanceHistory } = req.body;
    const { ai, model } = resolveAi(req.body);

    const prompt = `You are the Creative Intelligence Memory Engine of Projects Creative OS.
The user is querying the project's creative memory and performance records.

Brand Memory:
${JSON.stringify(brandMemory, null, 2)}

Creative Memory (All past assets, hooks, scripts, characters, winners, failed creatives):
${JSON.stringify(creativeMemory || [], null, 2)}

Performance Data:
${JSON.stringify(performanceHistory || [], null, 2)}

User Question/Search: "${query}"

Provide a thorough, data-driven answer analyzing past creatives. Include:
1. Direct answer citing specific past creatives, hooks, or characters.
2. Insights on what worked vs what underperformed.
3. Actionable recommendation for next content iterations based on learnings.

Return JSON with:
- answer (rich markdown string)
- matchedCreativeIds (array of strings if applicable)
- keyInsights (array of bullet points)
- recommendedNextSteps (array of actionable tips)`;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            answer: { type: Type.STRING },
            matchedCreativeIds: { type: Type.ARRAY, items: { type: Type.STRING } },
            keyInsights: { type: Type.ARRAY, items: { type: Type.STRING } },
            recommendedNextSteps: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ['answer', 'keyInsights', 'recommendedNextSteps'],
        },
      },
    });

    const text = response.text || '{}';
    res.json({ success: true, result: JSON.parse(text) });
  } catch (error: any) {
    console.error('Error querying creative memory:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to query creative memory' });
  }
});

// Endpoint: Generate Character Visual / Shot Visual Prompt
router.post('/character-prompt', async (req, res) => {
  try {
    const { characterName, description, style, visualTraits, brandMemory } = req.body;
    const { ai, model } = resolveAi(req.body);

    const prompt = `Generate a master visual prompt for a photorealistic digital UGC character named "${characterName}".
Style: ${style || 'Natural, relatable everyday iPhone selfie UGC quality, crisp lighting, 8k portrait'}
Description: ${description || 'Energetic young professional'}
Visual Traits: ${visualTraits || 'Warm smile, casual streetwear, authentic natural expression'}
Brand Context: ${brandMemory?.businessArea || 'Health & Brain Performance'}

Return JSON:
- masterPrompt (prompt for Fal.ai / Flux / Gemini Flash Image to generate high-consistency anchor portrait)
- negativePrompt
- recommendedLighting
- framingGuide`;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            masterPrompt: { type: Type.STRING },
            negativePrompt: { type: Type.STRING },
            recommendedLighting: { type: Type.STRING },
            framingGuide: { type: Type.STRING },
          },
          required: ['masterPrompt', 'negativePrompt', 'recommendedLighting', 'framingGuide'],
        },
      },
    });

    res.json({ success: true, result: JSON.parse(response.text || '{}') });
  } catch (error: any) {
    console.error('Error creating character prompt:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to generate character prompt' });
  }
});

// Endpoint: AI Creative Optimizer / Learning Engine
router.post('/optimize-learnings', async (req, res) => {
  try {
    const { brandMemory, creatives } = req.body;
    const { ai, model } = resolveAi(req.body);

    const prompt = `You are the Performance & Creative Intelligence Optimizer for Projects Creative OS.
Analyze all past creatives and extract high-signal patterns for future production.

Brand: ${brandMemory?.name}
Creatives & Performance:
${JSON.stringify(creatives || [], null, 2)}

Identify:
1. Winning Hook Patterns (which opening styles, lengths, questions, or triggers had best retention/CTR)
2. Character Performance (which digital characters convert best)
3. Topic/Angle resonance (which themes drove saves, shares, purchases)
4. Creative Fatigue & What to avoid
5. 3 specific High-Confidence Creative Proposals for the next batch.

Return JSON.`;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            winningPatterns: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  category: { type: Type.STRING },
                  finding: { type: Type.STRING },
                  impact: { type: Type.STRING },
                  confidenceScore: { type: Type.NUMBER },
                },
                required: ['category', 'finding', 'impact', 'confidenceScore'],
              },
            },
            recommendations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  concept: { type: Type.STRING },
                  expectedImpact: { type: Type.STRING },
                  suggestedFormat: { type: Type.STRING },
                },
                required: ['title', 'concept', 'expectedImpact', 'suggestedFormat'],
              },
            },
          },
          required: ['summary', 'winningPatterns', 'recommendations'],
        },
      },
    });

    res.json({ success: true, insights: JSON.parse(response.text || '{}') });
  } catch (error: any) {
    console.error('Error generating optimization learnings:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to analyze learnings' });
  }
});

export default router;
