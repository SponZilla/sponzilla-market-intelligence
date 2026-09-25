import { test, describe } from 'node:test';
import assert from 'node:assert';
import { DateExtractor } from '../../src/services/date.extractor';

describe('Date Extractor & Recency Unit Tests', () => {
  test('Extracts date from JSON-LD datePublished', () => {
    const html = '<html><head><script type="application/ld+json">{"datePublished": "2025-02-10T12:00:00Z"}</script></head></html>';
    const result = DateExtractor.extractDate(html);
    assert.strictEqual(result.publishedDate, '2025-02-10');
    assert.strictEqual(result.recency, 'recent');
  });

  test('Extracts date from meta tag article:published_time', () => {
    const html = '<html><head><meta property="article:published_time" content="2024-11-05T08:30:00Z" /></head></html>';
    const result = DateExtractor.extractDate(html);
    assert.strictEqual(result.publishedDate, '2024-11-05');
  });

  test('Extracts date from formatted text string', () => {
    const html = '<div>Published on Jan 15, 2025 by Press Team</div>';
    const result = DateExtractor.extractDate(html);
    assert.strictEqual(result.publishedDate, '2025-01-15');
    assert.strictEqual(result.recency, 'recent');
  });

  test('Returns null and unknown recency when no date present', () => {
    const html = '<div>Generic company landing page without date.</div>';
    const result = DateExtractor.extractDate(html);
    assert.strictEqual(result.publishedDate, null);
    assert.strictEqual(result.recency, 'unknown');
  });
});
