import type { Opportunity } from '@sponzilla/shared';
import { ensurePersistenceSchema, getPool } from '../db/pool';

export interface OpportunityRepository {
  save(opportunity: Opportunity): Promise<Opportunity>;
  findById(id: string): Promise<Opportunity | undefined>;
  list(): Promise<Opportunity[]>;
}

export const opportunityRepository: OpportunityRepository = {
  async save(opportunity: Opportunity): Promise<Opportunity> {
    await ensurePersistenceSchema();

    await getPool().query(
      `
        INSERT INTO opportunities (id, payload, created_at, updated_at)
        VALUES ($1, $2::jsonb, $3, NOW())
        ON CONFLICT (id) DO UPDATE
        SET payload = EXCLUDED.payload,
            updated_at = NOW()
      `,
      [opportunity.id, JSON.stringify(opportunity), opportunity.producedAt],
    );

    return opportunity;
  },

  async findById(id: string): Promise<Opportunity | undefined> {
    await ensurePersistenceSchema();

    const result = await getPool().query<{ payload: Opportunity }>(
      'SELECT payload FROM opportunities WHERE id = $1',
      [id],
    );

    return result.rows[0]?.payload;
  },

  async list(): Promise<Opportunity[]> {
    await ensurePersistenceSchema();

    const result = await getPool().query<{ payload: Opportunity }>(
      'SELECT payload FROM opportunities ORDER BY created_at DESC',
    );

    return result.rows.map((row) => row.payload);
  },
};

export function createInMemoryOpportunityRepository(): OpportunityRepository {
  const opportunities = new Map<string, Opportunity>();

  return {
    async save(opportunity) {
      opportunities.set(opportunity.id, opportunity);
      return opportunity;
    },
    async findById(id) {
      return opportunities.get(id);
    },
    async list() {
      return Array.from(opportunities.values());
    },
  };
}
