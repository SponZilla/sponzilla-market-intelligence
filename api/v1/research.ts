import type { VercelRequest, VercelResponse } from '@vercel/node';
import { CompanyInputSchema } from '@sponzilla/shared';
import { OpportunityService } from '../../apps/api/src/services/opportunity.service';

const opportunityService = new OpportunityService();

export const config = {
  maxDuration: 60
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    try {
      const parsedInput = CompanyInputSchema.parse(req.body);
      const result = await opportunityService.executeResearchPipeline(parsedInput);

      if (result.status === 'FAILED') {
        return res.status(500).json({
          error: 'RESEARCH_PIPELINE_ERROR',
          message: result.error || 'Pipeline execution failed',
          runId: result.id
        });
      }

      return res.status(201).json(result);
    } catch (err: any) {
      if (err.name === 'ZodError') {
        return res.status(400).json({
          error: 'VALIDATION_ERROR',
          details: err.errors
        });
      }
      return res.status(500).json({
        error: 'INTERNAL_SERVER_ERROR',
        message: err?.message || 'An unexpected error occurred'
      });
    }
  }

  return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
}
