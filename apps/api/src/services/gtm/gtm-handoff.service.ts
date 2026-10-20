import { OpportunityV1, parseOpportunityV1 } from '@sponzilla/contracts';
import { GTMHandoffResult } from '@sponzilla/shared';
import { config } from '../../config';

export interface GTMHandoffOptions {
  ingestUrl?: string;
  adminApiKey?: string;
  fetchFn?: typeof fetch;
}

export class GTMHandoffService {
  private readonly ingestUrl: string;
  private readonly adminApiKey: string;
  private readonly fetchClient: typeof fetch;

  constructor(options: GTMHandoffOptions = {}) {
    this.ingestUrl = options.ingestUrl || config.gtmIngestUrl;
    this.adminApiKey = options.adminApiKey || config.gtmAdminApiKey;
    this.fetchClient = options.fetchFn || fetch;
  }

  async postOpportunityToGTM(opportunity: OpportunityV1): Promise<GTMHandoffResult> {
    const attemptedAt = new Date().toISOString();
    const endpoint = this.ingestUrl;

    // Grounding rule: Do not forward unqualified/zero-evidence opportunities to CRM pipeline
    if (opportunity.qualificationStatus === 'NO_VERIFIED_OPPORTUNITY') {
      console.log(`[GTMHandoff] Skipping GTM handoff for ${opportunity.company.name}: qualificationStatus is NO_VERIFIED_OPPORTUNITY.`);
      return {
        status: 'SKIPPED',
        reason: 'NO_VERIFIED_OPPORTUNITY',
        attemptedAt,
        endpoint,
      };
    }

    // Verify OpportunityV1 contract integrity prior to HTTP transport
    let validatedPayload: OpportunityV1;
    try {
      validatedPayload = parseOpportunityV1(opportunity);
    } catch (err: any) {
      console.error(`[GTMHandoff] Contract validation failure before handoff:`, err?.message || err);
      return {
        status: 'FAILED',
        error: `Contract validation failed: ${err?.message || 'Invalid OpportunityV1'}`,
        attemptedAt,
        endpoint,
      };
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.adminApiKey) {
      headers['Authorization'] = `Bearer ${this.adminApiKey}`;
    }

    try {
      console.log(`[GTMHandoff] Auto-POSTing OpportunityV1 (${opportunity.id}) for "${opportunity.company.name}" to GTM ingest: ${endpoint}`);
      const res = await this.fetchClient(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(validatedPayload),
      });

      let responseBody: any = null;
      try {
        responseBody = await res.json();
      } catch {
        // response might not be JSON
      }

      if (res.status === 200 || res.status === 201) {
        const gtmOppId = responseBody?.data?.opportunity?.id || null;
        console.log(`[GTMHandoff] ✓ Successfully ingested into GTM (CRM Opportunity ID: ${gtmOppId})`);
        return {
          status: 'SUCCESS',
          statusCode: res.status,
          gtmOpportunityId: gtmOppId,
          attemptedAt,
          endpoint,
        };
      }

      const errorMessage = responseBody?.error || responseBody?.message || `HTTP ${res.status} from GTM ingest`;
      console.warn(`[GTMHandoff] GTM ingest returned HTTP ${res.status}: ${JSON.stringify(responseBody || {})}`);
      return {
        status: 'FAILED',
        statusCode: res.status,
        error: typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage),
        attemptedAt,
        endpoint,
      };
    } catch (networkError: any) {
      console.warn(`[GTMHandoff] Network failure connecting to GTM ingest (${endpoint}):`, networkError?.message || networkError);
      return {
        status: 'FAILED',
        error: networkError?.message || 'Connection to GTM ingest failed',
        attemptedAt,
        endpoint,
      };
    }
  }
}

export const gtmHandoffService = new GTMHandoffService();
