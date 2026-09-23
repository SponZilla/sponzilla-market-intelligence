import { z } from 'zod';

// Canonical domain contracts — do NOT redefine Opportunity here.
export {
  OpportunityV1Schema,
  parseOpportunityV1,
  safeParseOpportunityV1,
  type OpportunityV1,
  CompanyV1Schema,
  type CompanyV1,
  EvidenceV1Schema,
  type EvidenceV1,
  SignalV1Schema,
  type SignalV1,
  SignalTypeSchema,
  type SignalType,
  AIInferenceV1Schema,
  type AIInferenceV1,
  ConfidenceLevelSchema,
  type ConfidenceLevel,
  QualificationStatusSchema,
  type QualificationStatus,
  OpportunityOriginSchema,
  type OpportunityOrigin,
  SourceVerificationStatusSchema,
  type SourceVerificationStatus,
  ICPAssessmentV1Schema,
  type ICPAssessmentV1,
  BuyerPersonaV1Schema,
  type BuyerPersonaV1,
  DecisionMakerV1Schema,
  type DecisionMakerV1,
} from '@sponzilla/contracts';

import {
  EvidenceV1Schema,
  OpportunityV1Schema,
  SignalV1Schema,
  SignalTypeSchema,
  type EvidenceV1,
  type OpportunityV1,
  type SignalV1,
  type SignalType,
  type AIInferenceV1,
} from '@sponzilla/contracts';

/** @deprecated Use OpportunityV1 — alias for migration. */
export type Opportunity = OpportunityV1;
/** @deprecated Use EvidenceV1 */
export type Evidence = EvidenceV1;
/** @deprecated Use SignalV1 */
export type Signal = SignalV1;
/** @deprecated Use AIInferenceV1 */
export type AIInference = AIInferenceV1;

export const OpportunitySchema = OpportunityV1Schema;
export const SignalSchema = SignalV1Schema;
export const VerifiedEvidenceItemSchema = EvidenceV1Schema;
export const SignalTypeEnum = SignalTypeSchema;

/** Research API input — producer-only, not part of OpportunityV1 handoff. */
export const CompanyInputSchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  websiteUrl: z
    .string()
    .transform((val) => {
      let trimmed = val.trim();
      if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
        trimmed = `https://${trimmed}`;
      }
      return trimmed;
    })
    .pipe(z.string().url('Must be a valid URL')),
  location: z.string().nullable().optional().default(null),
  category: z.string().nullable().optional().default(null),
});
export type CompanyInput = z.infer<typeof CompanyInputSchema>;

/** Captured research source — producer-only; referenced via EvidenceV1.source. */
export const SourceSchema = z.object({
  id: z.string(),
  url: z.string().url(),
  title: z.string(),
  publishedDate: z.string().nullable().default(null),
  snippet: z.string(),
  verificationStatus: z
    .enum(['VERIFIED_LIVE', 'UNVERIFIED', 'FAILED_REACHABILITY'])
    .default('VERIFIED_LIVE'),
  capturedAt: z.string(),
});
export type Source = z.infer<typeof SourceSchema>;

/** Internal research run envelope. Opportunity payload is always OpportunityV1. */
export const ResearchRunSchema = z.object({
  id: z.string(),
  companyInput: CompanyInputSchema,
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED']),
  sources: z.array(SourceSchema),
  evidence: z.array(EvidenceV1Schema),
  signals: z.array(SignalV1Schema),
  opportunity: OpportunityV1Schema.nullable().default(null),
  error: z.string().nullable().default(null),
  createdAt: z.string(),
  completedAt: z.string().nullable().default(null),
});
export type ResearchRun = z.infer<typeof ResearchRunSchema>;
