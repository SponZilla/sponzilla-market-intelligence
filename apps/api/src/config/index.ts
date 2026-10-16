import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

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
};
