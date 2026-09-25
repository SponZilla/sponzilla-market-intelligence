import { test, describe } from 'node:test';
import assert from 'node:assert';
import { SignalDetector } from '../../src/services/signal.service';
import { Evidence } from '@sponzilla/shared';

describe('Signal Detector Unit Tests', () => {
  const detector = new SignalDetector();

  test('Detects product launch signal from matching evidence', () => {
    const mockEvidence: Evidence[] = [
      {
        id: 'ev_1',
        claim: 'Gymshark announced product launch',
        source: {
          title: 'Gymshark Launches New High-Performance Collection',
          url: 'https://gymshark.com/news',
          type: 'Newsroom / Press Release',
          publishedAt: '2025-01-10',
          verified: true
        },
        fact: 'Gymshark unveils new product line for spring 2025.',
        aiInference: 'Active product launch cycle.',
        opportunity: 'Target marketing team.',
        sourceId: 'src_1',
        confidenceScore: 0.95
      }
    ];

    const signals = detector.detectSignals('Gymshark', mockEvidence);
    assert.strictEqual(signals.length > 0, true);
    assert.strictEqual(signals.some(s => s.type === 'product_launch'), true);
  });

  test('Returns empty signals array when evidence is empty (no false signals)', () => {
    const signals = detector.detectSignals('Gymshark', []);
    assert.strictEqual(signals.length, 0);
  });
});
