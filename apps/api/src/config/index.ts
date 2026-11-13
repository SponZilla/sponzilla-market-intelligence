import dotenv from 'dotenv';
import path from 'path';

// From apps/api/src/config (or apps/api/dist/config) the monorepo root is four
// levels up. Three levels pointed at apps/.env, so the root .env was ignored.
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  host: process.env.HOST || '0.0.0.0',
  nodeEnv: process.env.NODE_ENV || 'development',
  openAiApiKey: process.env.OPENAI_API_KEY || '',
  databaseUrl: process.env.DATABASE_URL || '',
  searchProvider: (process.env.SEARCH_PROVIDER || '').trim().toLowerCase(),
  tavilyApiKey: process.env.TAVILY_API_KEY || '',
  braveApiKey: process.env.BRAVE_API_KEY || '',
  researchApiKey: process.env.RESEARCH_API_KEY || '',
  gtmIngestUrl: process.env.GTM_INGEST_URL || 'http://127.0.0.1:3000/api/v1/opportunities/ingest',
  gtmAdminApiKey: process.env.INTERNAL_ADMIN_API_KEY || process.env.GTM_ADMIN_API_KEY || '',
  // Forwarded to GTM as X-Operator-Id so the generated card belongs to the user
  // who asked for the research instead of landing with no owner.
  gtmOperatorId: process.env.GTM_OPERATOR_ID || '',
  enableGtmAutoHandoff: process.env.ENABLE_GTM_AUTO_HANDOFF !== 'false',
};
