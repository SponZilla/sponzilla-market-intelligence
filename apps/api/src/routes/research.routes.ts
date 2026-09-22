import { CompanyInputSchema } from '@sponzilla/shared';
import { FastifyInstance } from 'fastify';
import { OpportunityService } from '../services/opportunity.service';

const opportunityService = new OpportunityService();

export async function researchRoutes(fastify: FastifyInstance) {
  // Health Check Endpoint
  fastify.get('/api/v1/health', async (_req, reply) => {
    return reply.send({
      status: 'ok',
      service: 'SponZilla Market Intelligence API',
      timestamp: new Date().toISOString()
    });
  });

  // Trigger Research Pipeline
  fastify.post('/api/v1/research', async (req, reply) => {
    try {
      const parsedInput = CompanyInputSchema.parse(req.body);
      const result = await opportunityService.executeResearchPipeline(parsedInput);

      if (result.status === 'FAILED') {
        fastify.log.error(`Research pipeline failed: ${result.error}`);
        return reply.status(500).send({
          error: 'RESEARCH_PIPELINE_ERROR',
          message: result.error || 'Pipeline execution failed',
          runId: result.id
        });
      }

      return reply.status(201).send(result);
    } catch (err: any) {
      fastify.log.error(err);
      if (err.name === 'ZodError') {
        return reply.status(400).send({
          error: 'VALIDATION_ERROR',
          details: err.errors
        });
      }
      return reply.status(500).send({
        error: 'INTERNAL_SERVER_ERROR',
        message: err?.message || 'An unexpected error occurred'
      });
    }
  });

  // Get Research Run by ID
  fastify.get('/api/v1/research/:runId', async (req, reply) => {
    const { runId } = req.params as { runId: string };
    const run = opportunityService.getResearchRun(runId);

    if (!run) {
      return reply.status(404).send({
        error: 'NOT_FOUND',
        message: `Research run ${runId} not found`
      });
    }

    return reply.send(run);
  });

  // List All Opportunities
  fastify.get('/api/v1/opportunities', async (_req, reply) => {
    const opportunities = opportunityService.getAllOpportunities();
    return reply.send({ opportunities, count: opportunities.length });
  });

  // Get Single Opportunity by ID
  fastify.get('/api/v1/opportunities/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const opp = opportunityService.getOpportunity(id);

    if (!opp) {
      return reply.status(404).send({
        error: 'NOT_FOUND',
        message: `Opportunity ${id} not found`
      });
    }

    return reply.send(opp);
  });
}
