import { test, describe } from 'node:test';
import assert from 'node:assert';
import { OpportunityService } from '../../src/services/opportunity.service';
import { OpportunitySchema } from '@sponzilla/shared';

describe('Real Company Market Intelligence E2E Suite & Gymshark Handoff Validation', () => {
  const service = new OpportunityService();

  test('MANDATORY GYMSHARK VALIDATION: Real research → Evidence → OpportunityV1 schema handoff', async () => {
    const gymsharkInput = {
      companyName: 'Gymshark',
      websiteUrl: 'https://gymshark.com',
      location: 'New York, NY',
      category: 'Fitness & Retail Apparel'
    };

    console.log('\n🦈 Running Mandatory Gymshark E2E Validation Test...');
    const run = await service.executeResearchPipeline(gymsharkInput);

    assert.strictEqual(run.status, 'COMPLETED', `Gymshark research run status should be COMPLETED, got: ${run.error}`);
    assert.notStrictEqual(run.opportunity, null, 'Gymshark opportunity object must not be null');

    const opp = run.opportunity!;

    // 1. Company Information Check
    assert.strictEqual(opp.company.name, 'Gymshark');
    assert.strictEqual(opp.company.websiteUrl, 'https://gymshark.com');

    // 2. Source URLs verification (NO dummy or fake URLs)
    assert.strictEqual(Array.isArray(run.sources), true);
    assert.strictEqual(run.sources.length > 0, true, 'At least 1 live source URL must be retrieved for Gymshark');
    for (const src of run.sources) {
      assert.strictEqual(src.verificationStatus, 'VERIFIED_LIVE');
      assert.strictEqual(src.url.startsWith('http'), true);
      assert.strictEqual(src.url.includes('example.com'), false, 'Must NOT contain placeholder/example.com URLs');
    }

    // 3. Evidence Check
    assert.strictEqual(Array.isArray(opp.evidence), true);
    for (const ev of opp.evidence) {
      assert.strictEqual(ev.source.verified, true);
      assert.strictEqual(typeof ev.claim, 'string');
      assert.strictEqual(typeof ev.fact, 'string');
      assert.strictEqual(typeof ev.aiInference, 'string');
    }

    // 4. Signal Check
    assert.strictEqual(Array.isArray(opp.signals), true);

    // 5. Grounded AI Analysis Check
    assert.strictEqual(typeof opp.audience, 'string');
    assert.strictEqual(typeof opp.marketingNeed, 'string');
    assert.strictEqual(typeof opp.recommendation, 'string');
    assert.strictEqual(['HIGH', 'MEDIUM', 'LOW'].includes(opp.confidence), true);

    // 6. Mandatory OpportunityV1 Canonical Schema Validation
    const parsedOpp = OpportunitySchema.parse(opp);
    assert.deepStrictEqual(parsedOpp, opp, 'Gymshark output must strictly validate against OpportunitySchema');

    console.log('✅ Gymshark E2E Smoke Test Passed! Verified live sources:', run.sources.length);
  });

  test('E2E Evaluation Suite: Real company research for Red Bull & Nike', async () => {
    const companies = [
      { companyName: 'Red Bull', websiteUrl: 'https://redbull.com', category: 'Energy Drinks' },
      { companyName: 'Nike', websiteUrl: 'https://nike.com', category: 'Athletics' }
    ];

    for (const comp of companies) {
      const run = await service.executeResearchPipeline(comp);
      assert.strictEqual(run.status, 'COMPLETED');
      assert.notStrictEqual(run.opportunity, null);
      
      // Strict OpportunityV1 Schema Parse
      const validated = OpportunitySchema.parse(run.opportunity);
      assert.strictEqual(validated.company.name, comp.companyName);
    }
  });

  test('Missing Tavily Key Configuration Error when SEARCH_PROVIDER=tavily', async () => {
    const originalProvider = process.env.SEARCH_PROVIDER;
    const originalKey = process.env.TAVILY_API_KEY;

    try {
      process.env.SEARCH_PROVIDER = 'tavily';
      delete process.env.TAVILY_API_KEY;

      const run = await service.executeResearchPipeline({
        companyName: 'Test Company',
        websiteUrl: 'https://example.com'
      });

      assert.strictEqual(run.status, 'FAILED');
      assert.strictEqual(
        run.error?.includes('SEARCH_PROVIDER=tavily configured, but TAVILY_API_KEY environment variable is missing'),
        true
      );
    } finally {
      process.env.SEARCH_PROVIDER = originalProvider;
      if (originalKey) process.env.TAVILY_API_KEY = originalKey;
    }
  });
});
