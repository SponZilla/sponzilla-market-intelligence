import cors from '@fastify/cors';
import fastify from 'fastify';
import { researchRoutes } from './routes/research.routes';

export function buildApp() {
  const app = fastify({ logger: true });

  // Register CORS to allow web frontend requests
  app.register(cors, {
    origin: true
  });

  // Register API routes
  app.register(researchRoutes);

  return app;
}
