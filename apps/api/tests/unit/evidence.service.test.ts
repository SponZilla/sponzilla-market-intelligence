import { test, describe } from 'node:test';
import assert from 'node:assert';
import { EvidenceExtractor } from '../../src/services/evidence.service';
import { Source } from '@sponzilla/shared';

describe('Evidence Extractor Unit Tests', () => {
  const extractor = new EvidenceExtractor();

  test('Extracts structured evidence items from verified sources', () => {
    const mockSources: Source[] = [
      {
        id: 'src_100',
        url: 'https://redbull.com/news',
        title: 'Red Bull Renews Esports Partnership for 2025',
        publishedDate: '2025-02-01',
         snippet: 'Red Bull announced a major expansion of its esports tournament sponsorship portfolio worldwide.',
         content: 'Red Bull announced a major expansion of its esports tournament sponsorship portfolio worldwide. The company will continue its public activation program.',
         contentHash: 'sha256-test',
         retrievedAt: new Date().toISOString(),
        verificationStatus: 'VERIFIED_LIVE',
        capturedAt: new Date().toISOString()
      }
    ];

    const evidence = extractor.extractEvidence(mockSources, 'Red Bull');
     assert.strictEqual(evidence.length >= 1, true);
    assert.strictEqual(evidence[0].source.url, 'https://redbull.com/news');
    assert.strictEqual(evidence[0].source.verified, true);
    assert.strictEqual(typeof evidence[0].fact, 'string');
     assert.strictEqual(typeof evidence[0].aiInference, 'string');
     assert.strictEqual(evidence[0].sourceExcerpt?.includes('Red Bull announced'), true);
     assert.strictEqual(evidence[0].sourceContentHash, 'sha256-test');
     assert.strictEqual(evidence[0].confidenceScore < 0.95, true);
  });

  test('Ignores unverified or failed sources', () => {
    const mockSources: Source[] = [
      {
        id: 'src_101',
        url: 'https://example.com/failed',
        title: 'Failed Page',
        publishedDate: null,
        snippet: 'Failed content',
        verificationStatus: 'FAILED_REACHABILITY',
        capturedAt: new Date().toISOString()
      }
    ];

    const evidence = extractor.extractEvidence(mockSources, 'Example Corp');
    assert.strictEqual(evidence.length, 0);
  });
});
