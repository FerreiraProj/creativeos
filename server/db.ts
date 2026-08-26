import pg from 'pg';

export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
});

// Idempotent schema bootstrap. No separate migration framework: at this app's scale
// (single user, one JSONB-heavy table) a plain "CREATE TABLE IF NOT EXISTS" run once at
// startup is sufficient. Future schema changes should be additive
// ("ALTER TABLE ... ADD COLUMN IF NOT EXISTS") appended here.
export async function ensureSchema(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS projects (
      id              TEXT PRIMARY KEY,
      name            TEXT NOT NULL,
      description     TEXT NOT NULL DEFAULT '',
      code_prefix     TEXT NOT NULL,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
      brand_memory    JSONB NOT NULL,
      creative_memory JSONB NOT NULL DEFAULT '[]',
      characters      JSONB NOT NULL DEFAULT '[]',
      creatives       JSONB NOT NULL DEFAULT '[]',
      custom_recipes  JSONB NOT NULL DEFAULT '[]',
      insights        JSONB NOT NULL DEFAULT '[]',
      ai_config       JSONB NOT NULL
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS app_settings (
      key   TEXT PRIMARY KEY,
      value JSONB NOT NULL
    );
  `);
}
