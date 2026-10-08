import type { VercelRequest, VercelResponse } from '@vercel/node';
import { OpportunityService } from '../../apps/api/src/services/opportunity.service';

const opportunityService = new OpportunityService();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const opportunities = opportunityService.getAllOpportunities();
  return res.status(200).json({ opportunities, count: opportunities.length });
}
