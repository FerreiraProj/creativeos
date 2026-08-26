import { Router } from 'express';
import { pool } from '../db.ts';
import { buildNewProject, buildDuplicateProject } from '../projectDefaults.ts';
import { SAMPLE_NOOTRION_PROJECT } from '../../src/lib/constants.ts';

const router = Router();

function rowToProject(row: any) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    codePrefix: row.code_prefix,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
    updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : row.updated_at,
    brandMemory: row.brand_memory,
    creativeMemory: row.creative_memory,
    characters: row.characters,
    creatives: row.creatives,
    customRecipes: row.custom_recipes,
    insights: row.insights,
    aiConfig: row.ai_config,
  };
}

const SELECT_COLUMNS = `
  id, name, description, code_prefix, created_at, updated_at,
  brand_memory, creative_memory, characters, creatives, custom_recipes, insights, ai_config
`;

async function upsertProject(p: any) {
  const result = await pool.query(
    `INSERT INTO projects (
       id, name, description, code_prefix, created_at, updated_at,
       brand_memory, creative_memory, characters, creatives, custom_recipes, insights, ai_config
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
     ON CONFLICT (id) DO UPDATE SET
       name = EXCLUDED.name,
       description = EXCLUDED.description,
       code_prefix = EXCLUDED.code_prefix,
       updated_at = EXCLUDED.updated_at,
       brand_memory = EXCLUDED.brand_memory,
       creative_memory = EXCLUDED.creative_memory,
       characters = EXCLUDED.characters,
       creatives = EXCLUDED.creatives,
       custom_recipes = EXCLUDED.custom_recipes,
       insights = EXCLUDED.insights,
       ai_config = EXCLUDED.ai_config
     RETURNING ${SELECT_COLUMNS}`,
    [
      p.id,
      p.name,
      p.description,
      p.codePrefix,
      p.createdAt,
      p.updatedAt,
      JSON.stringify(p.brandMemory),
      JSON.stringify(p.creativeMemory ?? []),
      JSON.stringify(p.characters ?? []),
      JSON.stringify(p.creatives ?? []),
      JSON.stringify(p.customRecipes ?? []),
      JSON.stringify(p.insights ?? []),
      JSON.stringify(p.aiConfig),
    ]
  );
  return rowToProject(result.rows[0]);
}

// GET /api/projects — list all projects
router.get('/', async (_req, res) => {
  try {
    const result = await pool.query(`SELECT ${SELECT_COLUMNS} FROM projects ORDER BY created_at ASC`);
    res.json(result.rows.map(rowToProject));
  } catch (error: any) {
    console.error('Error listing projects:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to load projects' });
  }
});

// POST /api/projects — create a new blank project
router.post('/', async (req, res) => {
  try {
    const { name, description, codePrefix } = req.body;
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ success: false, error: 'name is required' });
    }
    const newProject = buildNewProject(name, description || '', codePrefix);
    const saved = await upsertProject(newProject);
    res.status(201).json(saved);
  } catch (error: any) {
    console.error('Error creating project:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to create project' });
  }
});

// PUT /api/projects/:id — save/update a full project
router.put('/:id', async (req, res) => {
  try {
    const project = { ...req.body, id: req.params.id, updatedAt: new Date().toISOString() };
    const saved = await upsertProject(project);
    res.json(saved);
  } catch (error: any) {
    console.error('Error saving project:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to save project' });
  }
});

// DELETE /api/projects/:id
router.delete('/:id', async (req, res) => {
  try {
    await pool.query(`DELETE FROM projects WHERE id = $1`, [req.params.id]);
    const result = await pool.query(`SELECT ${SELECT_COLUMNS} FROM projects ORDER BY created_at ASC`);
    res.json(result.rows.map(rowToProject));
  } catch (error: any) {
    console.error('Error deleting project:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to delete project' });
  }
});

// POST /api/projects/:id/duplicate — clone structure (not brand/creative memory)
router.post('/:id/duplicate', async (req, res) => {
  try {
    const { newName, newPrefix } = req.body;
    const sourceResult = await pool.query(`SELECT ${SELECT_COLUMNS} FROM projects WHERE id = $1`, [req.params.id]);
    if (sourceResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Source project not found' });
    }
    const source = rowToProject(sourceResult.rows[0]);
    const duplicated = buildDuplicateProject(source, newName, newPrefix);
    const saved = await upsertProject(duplicated);
    res.status(201).json(saved);
  } catch (error: any) {
    console.error('Error duplicating project:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to duplicate project' });
  }
});

// POST /api/projects/seed-nootrion — upsert the built-in Nootrion demo project
router.post('/seed-nootrion', async (_req, res) => {
  try {
    const saved = await upsertProject(SAMPLE_NOOTRION_PROJECT);
    res.json(saved);
  } catch (error: any) {
    console.error('Error seeding Nootrion demo project:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to load Nootrion demo' });
  }
});

export default router;
