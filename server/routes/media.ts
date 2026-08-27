import { Router } from 'express';
import { resolveFal, FAL_IMAGE_MODEL, FAL_VIDEO_MODEL } from '../fal.ts';

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
    res.status(500).json({ success: false, error: error.message || 'Failed to generate character image' });
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
    res.status(500).json({ success: false, error: error.message || 'Failed to upload photo' });
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
    res.status(500).json({ success: false, error: error.message || 'Failed to submit video generation job' });
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
      res.json({ success: true, status: 'FAILED', error: resultError.message || 'Video generation failed' });
    }
  } catch (error: any) {
    console.error('Error polling shot video job:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to poll video generation job' });
  }
});

export default router;
