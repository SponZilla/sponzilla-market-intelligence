import type { ResearchRun } from '@sponzilla/shared';
import { ensurePersistenceSchema, getPool } from '../db/pool';

export interface ResearchRepository {
  save(run: ResearchRun): Promise<ResearchRun>;
  findById(id: string): Promise<ResearchRun | undefined>;
}

export const researchRepository: ResearchRepository = {
  async save(run: ResearchRun): Promise<ResearchRun> {
    await ensurePersistenceSchema();

    await getPool().query(
      `
        INSERT INTO research_runs (id, payload, created_at, updated_at)
        VALUES ($1, $2::jsonb, $3, NOW())
        ON CONFLICT (id) DO UPDATE
        SET payload = EXCLUDED.payload,
            updated_at = NOW()
      `,
      [run.id, JSON.stringify(run), run.createdAt],
    );

    return run;
  },

  async findById(id: string): Promise<ResearchRun | undefined> {
    await ensurePersistenceSchema();

    const result = await getPool().query<{ payload: ResearchRun }>(
      'SELECT payload FROM research_runs WHERE id = $1',
      [id],
    );

    return result.rows[0]?.payload;
  },
};

export function createInMemoryResearchRepository(): ResearchRepository {
  const runs = new Map<string, ResearchRun>();

  return {
    async save(run) {
      runs.set(run.id, run);
      return run;
    },
    async findById(id) {
      return runs.get(id);
    },
  };
}
