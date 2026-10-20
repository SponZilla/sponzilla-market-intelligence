import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { GTMHandoffService } from '../../src/services/gtm/gtm-handoff.service';
import { gymsharkOpportunityV1Example } from '../../../../packages/contracts/examples/gymshark-opportunity-v1';
import { OpportunityV1 } from '@sponzilla/contracts';

describe('GTM Handoff Service Unit Tests', () => {
  test('Skips handoff when opportunity is unqualified (NO_VERIFIED_OPPORTUNITY)', async () => {
    let fetchCalled = false;
    const mockFetch = async () => {
      fetchCalled = true;
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    };

    const service = new GTMHandoffService({
      ingestUrl: 'http://127.0.0.1:3000/api/v1/opportunities/ingest',
      adminApiKey: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
      fetchFn: mockFetch as any,
    });

    const unqualifiedOpp: OpportunityV1 = {
      ...gymsharkOpportunityV1Example,
      qualificationStatus: 'NO_VERIFIED_OPPORTUNITY',
    };

    const result = await service.postOpportunityToGTM(unqualifiedOpp);

    assert.equal(result.status, 'SKIPPED');
    assert.equal(result.reason, 'NO_VERIFIED_OPPORTUNITY');
    assert.equal(fetchCalled, false, 'Fetch must not be invoked for unqualified opportunities');
  });

  test('Auto-POSTs qualified OpportunityV1 with Bearer token and parses successful CRM response', async () => {
    let capturedUrl = '';
    let capturedHeaders: Record<string, string> = {};
    let capturedBody: any = null;

    const mockFetch = async (url: any, init: any) => {
      capturedUrl = url.toString();
      capturedHeaders = init.headers;
      capturedBody = JSON.parse(init.body);

      return new Response(
        JSON.stringify({
          data: {
            company: { id: 'comp_123', name: 'Gymshark' },
            opportunity: { id: 'crm_opp_456', title: 'Gymshark Expansion' },
          },
        }),
        { status: 201, headers: { 'Content-Type': 'application/json' } },
      );
    };

    const testApiKey = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
    const testEndpoint = 'http://127.0.0.1:3000/api/v1/opportunities/ingest';

    const service = new GTMHandoffService({
      ingestUrl: testEndpoint,
      adminApiKey: testApiKey,
      fetchFn: mockFetch as any,
    });

    const result = await service.postOpportunityToGTM(gymsharkOpportunityV1Example);

    assert.equal(result.status, 'SUCCESS');
    assert.equal(result.statusCode, 201);
    assert.equal(result.gtmOpportunityId, 'crm_opp_456');
    assert.equal(capturedUrl, testEndpoint);
    assert.equal(capturedHeaders['Authorization'], `Bearer ${testApiKey}`);
    assert.equal(capturedBody.id, gymsharkOpportunityV1Example.id);
  });

  test('Gracefully handles HTTP 400/500 errors from GTM ingest without throwing', async () => {
    const mockFetch = async () => {
      return new Response(
        JSON.stringify({
          error: 'INVALID_OPPORTUNITY_V1',
          message: 'Malformed opportunity payload',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    };

    const service = new GTMHandoffService({
      ingestUrl: 'http://127.0.0.1:3000/api/v1/opportunities/ingest',
      fetchFn: mockFetch as any,
    });

    const result = await service.postOpportunityToGTM(gymsharkOpportunityV1Example);

    assert.equal(result.status, 'FAILED');
    assert.equal(result.statusCode, 400);
    assert.ok(result.error);
  });

  test('Gracefully handles network connection drops without throwing or crashing pipeline', async () => {
    const mockFetch = async () => {
      throw new Error('connect ECONNREFUSED 127.0.0.1:3000');
    };

    const service = new GTMHandoffService({
      ingestUrl: 'http://127.0.0.1:3000/api/v1/opportunities/ingest',
      fetchFn: mockFetch as any,
    });

    const result = await service.postOpportunityToGTM(gymsharkOpportunityV1Example);

    assert.equal(result.status, 'FAILED');
    assert.match(result.error || '', /ECONNREFUSED/);
  });
});
