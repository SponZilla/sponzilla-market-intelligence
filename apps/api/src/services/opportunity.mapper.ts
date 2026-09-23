import {
  parseOpportunityV1,
  type CompanyInput,
  type Evidence,
  type OpportunityV1,
  type Signal,
} from '@sponzilla/shared';

function companyContractId(name: string, websiteUrl: string): string {
  let host = 'unknown';
  try {
    host = new URL(websiteUrl).hostname.replace(/^www\./, '');
  } catch {
    host = websiteUrl.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
  }
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `company_${slug}_${host}`;
}

export interface BuildOpportunityV1Input {
  id: string;
  companyInput: CompanyInput;
  evidence: Evidence[];
  signals: Signal[];
  audience: string;
  marketingNeed: string;
  aiInference: OpportunityV1['aiInference'];
  confidence: OpportunityV1['confidence'];
  confidenceReason: string | null;
  recommendation: string;
  nextActionHint: string;
  /** AI analyzer legacy status → mapped to qualificationStatus */
  aiStatus: 'NEW' | 'no_verified_opportunity_found';
  producedAt: string;
}

/**
 * Single producer map: MI pipeline fields → canonical OpportunityV1.
 * No other reshape between MI and GTM.
 */
export function buildOpportunityV1(
  input: BuildOpportunityV1Input,
): OpportunityV1 {
  const {
    companyInput,
    aiStatus,
    nextActionHint,
    producedAt,
    ...rest
  } = input;

  const raw = {
    contractVersion: 'v1' as const,
    id: rest.id,
    origin: 'MARKET_INTELLIGENCE' as const,
    company: {
      contractId: companyContractId(
        companyInput.companyName,
        companyInput.websiteUrl,
      ),
      name: companyInput.companyName,
      websiteUrl: companyInput.websiteUrl,
      location: companyInput.location ?? null,
      industry: companyInput.category ?? null,
    },
    signals: rest.signals,
    evidence: rest.evidence,
    audience: rest.audience,
    marketingNeed: rest.marketingNeed,
    aiInference: rest.aiInference,
    confidence: rest.confidence,
    confidenceReason: rest.confidenceReason,
    recommendation: rest.recommendation,
    nextActionHint,
    qualificationStatus:
      aiStatus === 'no_verified_opportunity_found'
        ? ('NO_VERIFIED_OPPORTUNITY' as const)
        : ('QUALIFIED' as const),
    icpAssessment: null,
    buyerPersonas: [],
    decisionMakers: [],
    producedAt,
  };

  return parseOpportunityV1(raw);
}
