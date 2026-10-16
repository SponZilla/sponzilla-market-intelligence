import type { FastifyReply, FastifyRequest } from 'fastify';

export async function requireResearchApiKey(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<unknown> {
  const configuredKey = process.env.RESEARCH_API_KEY;
  if (!configuredKey) {
    return reply.code(503).send({
      error: 'RESEARCH_AUTH_NOT_CONFIGURED',
      message: 'Research API access is unavailable until RESEARCH_API_KEY is configured.',
    });
    return;
  }

  const authorization = request.headers.authorization;
  const providedKey =
    typeof authorization === 'string' && authorization.startsWith('Bearer ')
      ? authorization.slice('Bearer '.length)
      : request.headers['x-api-key'];

  if (providedKey !== configuredKey) {
    return reply.code(401).send({
      error: 'UNAUTHORIZED',
      message: 'Valid research API credentials required.',
    });
  }
}
