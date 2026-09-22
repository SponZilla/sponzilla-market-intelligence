import { z } from 'zod';

export const SignalTypeEnum = z.enum([
  'product_launch',
  'store_opening',
  'regional_expansion',
  'local_expansion',
  'marketing_campaign',
  'youth_campus_campaign',
  'sponsorship_announcement',
  'event_sponsorship',
  'marketing_hiring',
  'new_location',
  'influencer_campaign',
  'college_event_activity',
  'general_growth'
]);
export type SignalType = z.infer<typeof SignalTypeEnum>;

export const CompanyInputSchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  websiteUrl: z.string().transform(val => {
    let trimmed = val.trim();
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      trimmed = `https://${trimmed}`;
    }
    return trimmed;
  }).pipe(z.string().url('Must be a valid URL')),
  location: z.string().nullable().optional().default(null),
  category: z.string().nullable().optional().default(null),
});
export type CompanyInput = z.infer<typeof CompanyInputSchema>;

export const SourceSchema = z.object({
  id: z.string(),
  url: z.string().url(),
  title: z.string(),
  publishedDate: z.string().nullable().default(null),
  snippet: z.string(),
  verificationStatus: z.enum(['VERIFIED_LIVE', 'UNVERIFIED', 'FAILED_REACHABILITY']).default('VERIFIED_LIVE'),
  capturedAt: z.string(),
});
export type Source = z.infer<typeof SourceSchema>;

export const VerifiedEvidenceItemSchema = z.object({
  id: z.string(),
  claim: z.string(),
  source: z.object({
    title: z.string(),
    url: z.string().url(),
    type: z.string(),
    publishedAt: z.string().nullable().default(null),
    verified: z.boolean().default(true)
  }),
  fact: z.string(),
  aiInference: z.string(),
  opportunity: z.string(),
  sourceId: z.string(),
  confidenceScore: z.number().min(0).max(1)
});
export type Evidence = z.infer<typeof VerifiedEvidenceItemSchema>;

export const SignalSchema = z.object({
  id: z.string(),
  type: SignalTypeEnum,
  title: z.string(),
  summary: z.string(),
  evidenceIds: z.array(z.string()),
  sourceUrl: z.string().url().nullable().default(null),
  sourceTitle: z.string().nullable().default(null),
  detectedAt: z.string(),
});
export type Signal = z.infer<typeof SignalSchema>;

export const AIInferenceSchema = z.object({
  summary: z.string(),
  groundedReasoning: z.string(),
  assumptions: z.array(z.string()),
  unsupportedClaimsWarning: z.string().nullable().default(null),
});
export type AIInference = z.infer<typeof AIInferenceSchema>;

export const OpportunitySchema = z.object({
  id: z.string(),
  company: z.object({
    name: z.string(),
    websiteUrl: z.string(),
    location: z.string().nullable(),
    category: z.string().nullable(),
  }),
  signals: z.array(SignalSchema),
  evidence: z.array(VerifiedEvidenceItemSchema),
  audience: z.string(),
  marketingNeed: z.string(),
  aiInference: AIInferenceSchema,
  confidence: z.enum(['HIGH', 'MEDIUM', 'LOW']),
  confidenceReason: z.string().nullable().default(null),
  recommendation: z.string(),
  status: z.enum(['NEW', 'REVIEWED', 'ACTIONED', 'ARCHIVED', 'no_verified_opportunity_found']).default('NEW'),
  nextAction: z.string(),
  outcome: z.string().nullable().default(null),
  createdAt: z.string(),
});
export type Opportunity = z.infer<typeof OpportunitySchema>;

export const ResearchRunSchema = z.object({
  id: z.string(),
  companyInput: CompanyInputSchema,
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED']),
  sources: z.array(SourceSchema),
  evidence: z.array(VerifiedEvidenceItemSchema),
  signals: z.array(SignalSchema),
  opportunity: OpportunitySchema.nullable().default(null),
  error: z.string().nullable().default(null),
  createdAt: z.string(),
  completedAt: z.string().nullable().default(null),
});
export type ResearchRun = z.infer<typeof ResearchRunSchema>;
