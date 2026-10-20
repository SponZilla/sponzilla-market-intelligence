import { CompanyInput, EvidenceV1, OpportunityV1, ResearchRun, SignalV1, Source } from '@sponzilla/shared';

/**
 * Grounding Rule: SponZilla strictly prohibits inventing contacts, budgets,
 * campaigns, sponsorship history, or opportunities in production.
 *
 * This fallback generator is strictly prohibited in production and will throw.
 * In development, it must only be used if explicitly permitted, and is tagged
 * as an unverified synthetic simulation.
 */
export function executeClientResearch(input: CompanyInput): ResearchRun {
  const isProduction =
    (typeof process !== 'undefined' && process.env?.NODE_ENV === 'production') ||
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.PROD);

  if (isProduction) {
    throw new Error(
      "Grounding Rule Violation: Synthetic client-side research is strictly disabled in production. All Market Intelligence must originate from live, verified web sources."
    );
  }

  const now = new Date().toISOString();
  const runId = `run_sim_${Math.random().toString(36).substring(2, 10)}`;
  const oppId = `opp_sim_${Math.random().toString(36).substring(2, 10)}`;
  
  const companyName = input.companyName.trim();
  const websiteUrl = input.websiteUrl.trim();
  const domain = websiteUrl.replace(/^https?:\/\//i, '').replace(/\/.*$/, '');
  const slug = companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  const cleanBaseUrl = websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`;

  // Synthetic sources tagged as UNVERIFIED to avoid misleading operators
  const sources: Source[] = [
    {
      id: `src_sim_1_${slug}`,
      url: cleanBaseUrl,
      title: `${companyName} [SIMULATION] - Unverified Sandbox Overview`,
      publishedDate: null,
      snippet: `[DEMO SIMULATION] This is simulated content for local testing. Not verified via live search.`,
      verificationStatus: 'UNVERIFIED',
      capturedAt: now
    }
  ];

  const evidence: EvidenceV1[] = [
    {
      id: `ev_sim_1_${slug}`,
      claim: `${companyName} [SIMULATION - NOT GROUNDED]`,
      fact: `Offline simulation placeholder: no live web evidence was retrieved for ${companyName}.`,
      aiInference: `Offline simulation only. Do not execute real GTM outreach against this placeholder.`,
      suggestedAngle: null,
      sourceId: sources[0].id,
      source: {
        title: sources[0].title,
        url: sources[0].url,
        type: 'Unverified Sandbox',
        publishedAt: null,
        verified: false
      },
      confidenceScore: 0.1
    }
  ];

  const signals: SignalV1[] = [];

  const opportunity: OpportunityV1 = {
    contractVersion: 'v1',
    id: oppId,
    origin: 'MARKET_INTELLIGENCE',
    company: {
      contractId: `company_${slug}_${domain}`,
      name: companyName,
      websiteUrl: input.websiteUrl,
      location: input.location || null,
      industry: input.category || null
    },
    signals,
    evidence,
    audience: 'Unknown / unverified in offline simulation',
    marketingNeed: 'Unknown / unverified in offline simulation',
    aiInference: {
      summary: `Offline simulation placeholder for ${companyName}. No live evidence gathered.`,
      groundedReasoning: `Grounding rule enforcement: No live sources reachable. Synthetic facts are prohibited.`,
      assumptions: ['Running in offline development fallback mode.'],
      unsupportedClaimsWarning: 'SIMULATED DEMO: Synthetic placeholder. Not grounded in live web sources.'
    },
    confidence: 'LOW',
    confidenceReason: 'Zero verified live sources retrieved.',
    recommendation: 'Run pipeline with live search provider (Tavily/Brave) to discover verified opportunities.',
    nextActionHint: 'Connect live search credentials.',
    qualificationStatus: 'NO_VERIFIED_OPPORTUNITY',
    icpAssessment: null,
    buyerPersonas: [],
    decisionMakers: [],
    producedAt: now
  };

  return {
    id: runId,
    companyInput: input,
    status: 'COMPLETED',
    sources,
    evidence,
    signals,
    opportunity,
    gtmHandoff: {
      status: 'SKIPPED',
      reason: 'NO_VERIFIED_OPPORTUNITY',
      attemptedAt: now,
    },
    error: null,
    createdAt: now,
    completedAt: now
  };
}
