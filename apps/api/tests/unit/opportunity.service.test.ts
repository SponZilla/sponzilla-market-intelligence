import { test, describe } from 'node:test';
import assert from 'node:assert';
import { OpportunityService } from '../../src/services/opportunity.service';

describe('OpportunityService & Contract Validation Unit Tests', () => {
  const service = new OpportunityService();

  test('Rejects invalid empty companyName input format', async () => {
    const invalidInput = {
      companyName: '',
      websiteUrl: 'https://example.com'
    };

    await assert.rejects(
      async () => {
        await service.executeResearchPipeline(invalidInput as any);
      },
      (err: any) => {
        return err.name === 'ZodError' || err.message.includes('Company name is required');
      }
    );
  });

  test('Handles non-existent domain gracefully with no_verified_opportunity_found status', async () => {
    const nonExistentInput = {
      companyName: 'NonExistent Domain Corp',
      websiteUrl: 'https://nonexistent-fake-domain-999.com',
      location: 'Unknown',
      category: 'Fake Tech'
    };

    const run = await service.executeResearchPipeline(nonExistentInput);
    assert.strictEqual(run.status, 'COMPLETED');
    assert.notStrictEqual(run.opportunity, null);
    if (run.opportunity) {
      assert.strictEqual(run.opportunity.status, 'no_verified_opportunity_found');
      assert.strictEqual(run.opportunity.confidence, 'LOW');
      assert.strictEqual(run.opportunity.evidence.length, 0);
      assert.strictEqual(run.opportunity.signals.length, 0);
    }
  });
});
