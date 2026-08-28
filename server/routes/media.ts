import { Router } from 'express';
import sharp from 'sharp';
import { resolveFal, extractFalErrorMessage, FAL_IMAGE_MODEL, FAL_VIDEO_MODEL } from '../fal.ts';

const router = Router();

// Endpoint: synchronous character portrait generation (fast — flux/schnell typically
// finishes in a few seconds, so no job/polling machinery needed for this one).
router.post('/character-image', async (req, res) => {
  try {
    const { prompt, negativePrompt } = req.body;
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ success: false, error: 'prompt is required' });
    }
    const fal = resolveFal(req.body);
    // flux-1/schnell (a fast distilled model) doesn't accept a negative_prompt field at all,
    // unlike most other Fal image models — negativePrompt is accepted here from the client
    // for forward-compatibility but intentionally not forwarded to this particular model.
    void negativePrompt;
    const result = await fal.subscribe(FAL_IMAGE_MODEL, {
      input: {
        prompt,
        image_size: 'portrait_4_3',
      },
    });
    const imageUrl = result.data?.images?.[0]?.url;
    if (!imageUrl) {
      throw new Error('Fal.ai did not return an image');
    }
    res.json({ success: true, imageUrl });
  } catch (error: any) {
    console.error('Error generating character image:', error);
    res.status(500).json({ success: false, error: extractFalErrorMessage(error, 'Failed to generate character image') });
  }
});

const DATA_URL_PATTERN = /^data:([^;]+);base64,(.+)$/;

// Endpoint: upload a user-supplied photo (attach instead of generate). Stores it on Fal.ai's
// own storage so the resulting URL is a real, publicly-fetchable one — required later for the
// shot-video model, which needs to fetch the reference image itself, not just display it here.
router.post('/upload-character-image', async (req, res) => {
  try {
    const { fileDataUrl } = req.body;
    if (typeof fileDataUrl !== 'string') {
      return res.status(400).json({ success: false, error: 'fileDataUrl is required' });
    }
    const match = fileDataUrl.match(DATA_URL_PATTERN);
    if (!match) {
      return res.status(400).json({ success: false, error: 'fileDataUrl must be a data: URL' });
    }
    const [, mimeType, base64Data] = match;
    if (!mimeType.startsWith('image/')) {
      return res.status(400).json({ success: false, error: 'Only image files are supported' });
    }

    const buffer = Buffer.from(base64Data, 'base64');
    const blob = new Blob([buffer], { type: mimeType });

    const fal = resolveFal(req.body);
    const imageUrl = await fal.storage.upload(blob);
    res.json({ success: true, imageUrl });
  } catch (error: any) {
    console.error('Error uploading character image:', error);
    res.status(500).json({ success: false, error: extractFalErrorMessage(error, 'Failed to upload photo') });
  }
});

// Endpoint: submit a shot-video generation job. Returns immediately with a request id —
// video generation takes far longer than a normal HTTP request should stay open, so the
// client polls /shot-video/status separately instead of waiting here.
router.post('/shot-video/submit', async (req, res) => {
  try {
    const { prompt, imageUrls, aspectRatio, durationSec } = req.body;
    if (!prompt || !Array.isArray(imageUrls) || imageUrls.length === 0) {
      return res.status(400).json({ success: false, error: 'prompt and imageUrls are required' });
    }
    const fal = resolveFal(req.body);
    const queued = await fal.queue.submit(FAL_VIDEO_MODEL, {
      input: {
        prompt,
        image_urls: imageUrls,
        aspect_ratio: aspectRatio || '9:16',
        duration: durationSec || 8,
      },
    });
    res.json({ success: true, requestId: queued.request_id });
  } catch (error: any) {
    console.error('Error submitting shot video job:', error);
    res.status(500).json({ success: false, error: extractFalErrorMessage(error, 'Failed to submit video generation job') });
  }
});

// Endpoint: poll a previously-submitted job. Fal's queue status only ever reports
// IN_QUEUE / IN_PROGRESS / COMPLETED — there is no distinct "FAILED" status value, so a
// failed generation surfaces as a thrown error from queue.result(), which we translate into
// {status: 'FAILED', error}.
router.post('/shot-video/status', async (req, res) => {
  try {
    const { requestId } = req.body;
    if (!requestId || typeof requestId !== 'string') {
      return res.status(400).json({ success: false, error: 'requestId is required' });
    }
    const fal = resolveFal(req.body);
    const statusResult = await fal.queue.status(FAL_VIDEO_MODEL, { requestId, logs: false });

    if (statusResult.status !== 'COMPLETED') {
      return res.json({ success: true, status: statusResult.status });
    }

    try {
      const result = await fal.queue.result(FAL_VIDEO_MODEL, { requestId });
      const videoUrl = (result.data as any)?.video?.url;
      if (!videoUrl) {
        throw new Error('Fal.ai completed the job but returned no video URL');
      }
      res.json({ success: true, status: 'COMPLETED', videoUrl });
    } catch (resultError: any) {
      res.json({ success: true, status: 'FAILED', error: extractFalErrorMessage(resultError, 'Video generation failed') });
    }
  } catch (error: any) {
    console.error('Error polling shot video job:', error);
    res.status(500).json({ success: false, error: extractFalErrorMessage(error, 'Failed to poll video generation job') });
  }
});

const BLOG_IMAGE_CROPS: Record<string, { width: number; height: number }> = {
  instagramSquareUrl: { width: 1080, height: 1080 }, // also used for Facebook's square feed option
  instagramPortraitUrl: { width: 1080, height: 1350 },
  instagramStoryUrl: { width: 1080, height: 1920 },
  facebookUrl: { width: 1200, height: 630 },
  linkedinUrl: { width: 1200, height: 627 },
  twitterUrl: { width: 1600, height: 900 },
};

// The true minimum the master must be for every crop above to work via crop-only (never
// upscaling) — the widest crop's width, and the tallest crop's height.
const MIN_MASTER_WIDTH = Math.max(...Object.values(BLOG_IMAGE_CROPS).map((c) => c.width));
const MIN_MASTER_HEIGHT = Math.max(...Object.values(BLOG_IMAGE_CROPS).map((c) => c.height));

// Requested master size: fal-ai/flux-1/schnell does NOT reliably honor arbitrary custom
// image_size values — live testing showed a naive "9:16 at 1632px wide" request (1632x2901)
// silently gets clamped, and other moderately-tall requests (e.g. 1600x1920) can fall back to
// a completely different, smaller, near-square shape instead of erroring. 1632x2048 was the
// one size confirmed to be honored exactly, consistently, across multiple different prompts —
// use that literal value rather than a computed one. It still comfortably covers every crop
// (MIN_MASTER_WIDTH=1600, MIN_MASTER_HEIGHT=1920). The runtime check below validates the
// ACTUAL returned size against the true minimums regardless, in case this ever changes.
const MASTER_IMAGE_WIDTH = 1632;
const MASTER_IMAGE_HEIGHT = 2048;

// Endpoint: generate one blog article "hero" image, then crop it server-side into every
// target social-format size (never re-generating or upscaling per format).
router.post('/blog-article-image', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ success: false, error: 'prompt is required' });
    }
    const fal = resolveFal(req.body);

    const master = await fal.subscribe(FAL_IMAGE_MODEL, {
      input: {
        prompt,
        image_size: { width: MASTER_IMAGE_WIDTH, height: MASTER_IMAGE_HEIGHT },
      },
    });
    const masterUrl = master.data?.images?.[0]?.url;
    if (!masterUrl) {
      throw new Error('Fal.ai did not return a master image');
    }

    const masterBytes = Buffer.from(await (await fetch(masterUrl)).arrayBuffer());
    const meta = await sharp(masterBytes).metadata();
    if (!meta.width || !meta.height || meta.width < MIN_MASTER_WIDTH || meta.height < MIN_MASTER_HEIGHT) {
      throw new Error(`Master image too small for crop-only sizing: got ${meta.width}x${meta.height}, need at least ${MIN_MASTER_WIDTH}x${MIN_MASTER_HEIGHT}`);
    }

    const images: Record<string, string> = { masterUrl };
    for (const [key, size] of Object.entries(BLOG_IMAGE_CROPS)) {
      const cropped = await sharp(masterBytes)
        .resize(size.width, size.height, { fit: 'cover', position: 'centre' })
        .jpeg({ quality: 92 })
        .toBuffer();
      images[key] = await fal.storage.upload(new Blob([cropped], { type: 'image/jpeg' }));
    }

    res.json({ success: true, images });
  } catch (error: any) {
    console.error('Error generating blog article images:', error);
    res.status(500).json({ success: false, error: extractFalErrorMessage(error, 'Failed to generate blog article images') });
  }
});

export default router;
