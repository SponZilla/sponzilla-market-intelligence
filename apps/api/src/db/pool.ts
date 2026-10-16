import { Pool } from 'pg';
import { config } from '../config';

let pool: Pool | undefined;

export function getPool(): Pool {
  if (!pool) {
    if (!config.databaseUrl) {
      throw new Error('DATABASE_URL must be configured for persistent storage.');
    }

    pool = new Pool({
      connectionString: config.databaseUrl,
      max: Number(process.env.DATABASE_POOL_MAX || 10),
      idleTimeoutMillis: 30_000,
    });
  }

  return pool;
}

let schemaPromise: Promise<void> | undefined;

export function ensurePersistenceSchema(): Promise<void> {
  if (!schemaPromise) {
    schemaPromise = getPool().query(`
      CREATE TABLE IF NOT EXISTS research_runs (
        id TEXT PRIMARY KEY,
        payload JSONB NOT NULL,
        created_at TIMESTAMPTZ NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL
      );

      CREATE TABLE IF NOT EXISTS opportunities (
        id TEXT PRIMARY KEY,
        payload JSONB NOT NULL,
        created_at TIMESTAMPTZ NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL
      );

      CREATE INDEX IF NOT EXISTS research_runs_created_at_idx
        ON research_runs (created_at DESC);

      CREATE INDEX IF NOT EXISTS opportunities_created_at_idx
        ON opportunities (created_at DESC);
    `).then(() => undefined).catch((error) => {
      schemaPromise = undefined;
      throw error;
    });
  }

  return schemaPromise;
}
