import type { FastifyReply, FastifyRequest } from 'fastify';

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 30;
const requests = new Map<string, { startedAt: number; count: number }>();

export async function researchRateLimit(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<unknown> {
  const now = Date.now();
  const key = request.ip;
  const current = requests.get(key);
  const entry = !current || now - current.startedAt >= WINDOW_MS
    ? { startedAt: now, count: 0 }
    : current;

  entry.count += 1;
  requests.set(key, entry);

  if (entry.count > MAX_REQUESTS) {
    return reply.code(429).send({
      error: 'RESEARCH_RATE_LIMIT_EXCEEDED',
      message: 'Too many research requests. Please try again later.',
    });
  }
}
