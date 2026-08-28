import { Router } from 'express';
import { Type } from '@google/genai';
import { resolveAi } from '../gemini.ts';

const router = Router();

// Past blog articles (titles/summaries) passed into every generation prompt below so the AI
// avoids repeating angles already covered — this project's own blogArticles array IS the
// memory here, not the unrelated video creativeMemory array.
function pastArticlesContext(blogArticles: any[]): string {
  const past = (blogArticles || [])
    .filter((a) => a?.title || a?.ideaSummary)
    .slice(0, 15)
    .map((a) => ({ title: a.title || undefined, summary: a.ideaSummary }));
  return JSON.stringify(past, null, 2);
}

// Endpoint: Generate 5 blog article ideas
router.post('/ideas', async (req, res) => {
  try {
    const { brandMemory, blogArticles, topic, count = 5 } = req.body;
    const { ai, model } = resolveAi(req.body);

    const prompt = `You are a premier content strategist and SEO copywriter for brand blogs.
Brand Context:
${JSON.stringify(brandMemory, null, 2)}

Already-published or in-progress articles (avoid repeating these angles — suggest genuinely new perspectives instead):
${pastArticlesContext(blogArticles)}

Topic or Angle: ${topic || 'Whatever is most valuable and on-brand for this audience right now'}

Generate ${count} distinct blog article ideas. For each idea provide:
- title (a working title, not final)
- angle (the unique perspective/hook for this piece)
- summary (2-3 sentences describing what the article will cover)
- targetAudience (who specifically this resonates with)
- whyItWorks (why this idea is valuable/differentiated)

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
              angle: { type: Type.STRING },
              summary: { type: Type.STRING },
              targetAudience: { type: Type.STRING },
              whyItWorks: { type: Type.STRING },
            },
            required: ['title', 'angle', 'summary', 'targetAudience', 'whyItWorks'],
          },
        },
      },
    });

    const text = response.text || '[]';
    res.json({ success: true, ideas: JSON.parse(text) });
  } catch (error: any) {
    console.error('Error generating blog ideas:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to generate blog ideas' });
  }
});

// Endpoint: Generate 3 suggestive titles for a chosen/written idea
router.post('/titles', async (req, res) => {
  try {
    const { brandMemory, ideaSummary, blogArticles } = req.body;
    const { ai, model } = resolveAi(req.body);

    const prompt = `You are a premier headline writer for brand blogs, skilled at titles that are both clickable and credible (no clickbait that the article can't deliver on).
Brand Context:
${JSON.stringify(brandMemory, null, 2)}

Article Idea:
${ideaSummary}

Already-used titles (do not repeat or produce close variants of these):
${pastArticlesContext(blogArticles)}

Generate exactly 3 distinct, highly suggestive title options for this article, each with a different angle/hook. For each provide:
- title
- rationale (one short sentence on why this title works)

Return valid JSON with an array of exactly 3 objects.`;

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
              rationale: { type: Type.STRING },
            },
            required: ['title', 'rationale'],
          },
        },
      },
    });

    const text = response.text || '[]';
    res.json({ success: true, titles: JSON.parse(text) });
  } catch (error: any) {
    console.error('Error generating blog titles:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to generate blog titles' });
  }
});

// Endpoint: Generate the full article body (Markdown)
router.post('/article', async (req, res) => {
  try {
    const { brandMemory, title, ideaSummary, blogArticles } = req.body;
    const { ai, model } = resolveAi(req.body);

    const prompt = `You are a premier long-form content writer for brand blogs, writing in a voice that matches the brand's tone exactly.
Brand Context:
${JSON.stringify(brandMemory, null, 2)}

Language: ${brandMemory?.language || 'Portuguese (Portugal / International)'}
Tone: ${brandMemory?.communicationTone?.tone || 'Match the brand context above'}

Title: ${title}
Idea / Angle: ${ideaSummary}

Already-published or in-progress articles (do not repeat content/structure from these — write a genuinely fresh piece):
${pastArticlesContext(blogArticles)}

Write the full article body in clean Markdown (headings with #/##, short paragraphs, bullet lists where useful — no raw HTML). Structure it with a strong opening hook, clear sections, and a closing takeaway. Aim for genuine value and readability, not filler.

Also write a short excerpt: a plain-text (no Markdown, no headings), 1-2 sentence summary of the article, roughly 150-200 characters. This is used as the blog post's preview summary on listing/homepage pages (e.g. Shopify's blog "Excerpt" field), so it must work as a standalone teaser, not just the article's opening line.

Return JSON with two fields:
- bodyMarkdown (the full article as a Markdown string)
- excerpt (the short plain-text summary described above)`;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            bodyMarkdown: { type: Type.STRING },
            excerpt: { type: Type.STRING },
          },
          required: ['bodyMarkdown', 'excerpt'],
        },
      },
    });

    const text = response.text || '{}';
    res.json({ success: true, article: JSON.parse(text) });
  } catch (error: any) {
    console.error('Error generating blog article:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to generate blog article' });
  }
});

// Endpoint: (re)generate just the short listing/homepage excerpt for an already-written
// article — used after the body has been edited and the excerpt has gone stale.
router.post('/excerpt', async (req, res) => {
  try {
    const { brandMemory, title, bodyMarkdown } = req.body;
    const { ai, model } = resolveAi(req.body);

    const prompt = `You are a premier editor for brand blogs, skilled at writing short preview summaries.
Brand Context:
${JSON.stringify(brandMemory, null, 2)}

Title: ${title}

Full Article (Markdown):
${bodyMarkdown}

Write a short excerpt: a plain-text (no Markdown, no headings), 1-2 sentence summary of the article, roughly 150-200 characters. This is used as the blog post's preview summary on listing/homepage pages (e.g. Shopify's blog "Excerpt" field), so it must work as a standalone teaser, not just the article's opening line.

Return JSON with a single field:
- excerpt (the short plain-text summary described above)`;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            excerpt: { type: Type.STRING },
          },
          required: ['excerpt'],
        },
      },
    });

    const text = response.text || '{}';
    res.json({ success: true, ...JSON.parse(text) });
  } catch (error: any) {
    console.error('Error generating blog excerpt:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to generate blog excerpt' });
  }
});

// Endpoint: Apply a targeted edit to the full article, driven by a free-text instruction
router.post('/edit', async (req, res) => {
  try {
    const { brandMemory, title, currentBodyMarkdown, instruction } = req.body;
    const { ai, model } = resolveAi(req.body);

    if (!instruction || typeof instruction !== 'string' || !instruction.trim()) {
      return res.status(400).json({ success: false, error: 'instruction is required' });
    }

    const prompt = `You are a premier editor for brand blogs. You will be given the full current Markdown text of an article and a specific instruction describing a change to make.

Brand Context:
${JSON.stringify(brandMemory, null, 2)}

Title: ${title}

Current Article (Markdown):
${currentBodyMarkdown}

Instruction: "${instruction}"

Apply ONLY the requested change. Preserve everything else in the article exactly as it is — do not rewrite unrelated sections, do not change the overall structure unless the instruction asks for it.

Return JSON with a single field:
- bodyMarkdown (the FULL updated article as a Markdown string, not just the changed part)`;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            bodyMarkdown: { type: Type.STRING },
          },
          required: ['bodyMarkdown'],
        },
      },
    });

    const text = response.text || '{}';
    res.json({ success: true, article: JSON.parse(text) });
  } catch (error: any) {
    console.error('Error editing blog article:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to edit blog article' });
  }
});

export default router;
