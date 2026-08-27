import { Router } from 'express';
import { pool } from '../db.ts';

const router = Router();

const DEFAULT_AI_GATEWAY_CONFIG = {
  textModel: 'gemini-3.6-flash',
  videoModel: 'gemini-omni',
  audioModel: 'gemini-tts',
  byokKeys: {
    geminiApiKey: '',
    falApiKey: '',
    openaiApiKey: '',
  },
};

async function getSetting(key: string): Promise<any | null> {
  const result = await pool.query(`SELECT value FROM app_settings WHERE key = $1`, [key]);
  return result.rows.length > 0 ? result.rows[0].value : null;
}

async function setSetting(key: string, value: any): Promise<void> {
  await pool.query(
    `INSERT INTO app_settings (key, value) VALUES ($1, $2)
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
    [key, JSON.stringify(value)]
  );
}

// GET/PUT /api/settings/active-project — replaces the old ACTIVE_PROJECT_KEY localStorage key
router.get('/active-project', async (_req, res) => {
  try {
    const value = await getSetting('active_project_id');
    res.json({ id: value?.id ?? null });
  } catch (error: any) {
    console.error('Error reading active project setting:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to read active project' });
  }
});

router.put('/active-project', async (req, res) => {
  try {
    const { id } = req.body;
    await setSetting('active_project_id', { id: id ?? null });
    res.json({ id: id ?? null });
  } catch (error: any) {
    console.error('Error saving active project setting:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to save active project' });
  }
});

// GET/PUT /api/settings/ai-gateway — replaces the old AI_GATEWAY_STORAGE_KEY localStorage key
router.get('/ai-gateway', async (_req, res) => {
  try {
    const value = await getSetting('ai_gateway_config');
    res.json(value ?? DEFAULT_AI_GATEWAY_CONFIG);
  } catch (error: any) {
    console.error('Error reading AI gateway settings:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to read AI gateway settings' });
  }
});

router.put('/ai-gateway', async (req, res) => {
  try {
    await setSetting('ai_gateway_config', req.body);
    res.json(req.body);
  } catch (error: any) {
    console.error('Error saving AI gateway settings:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to save AI gateway settings' });
  }
});

export default router;
