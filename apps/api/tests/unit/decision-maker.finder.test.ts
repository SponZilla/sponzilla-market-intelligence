import { test, describe } from 'node:test';
import assert from 'node:assert';
import { DecisionMakerFinder } from '../../src/services/research/decision-maker.finder';
import { ISearchProvider, SearchResultItem } from '../../src/services/research/search-provider.interface';
import { DecisionMakerV1Schema } from '@sponzilla/shared';

describe('DecisionMakerFinder Unit Tests (Grounding & Provenance)', () => {
  test('Extracts real LinkedIn profiles with name, title, and provenance', async () => {
    const mockProvider: ISearchProvider = {
      name: 'mock',
      async search(_query: string): Promise<SearchResultItem[]> {
        return [
          {
            url: 'https://uk.linkedin.com/in/noelmack?originalSubdomain=uk',
            title: 'Noel Mack - Chief Brand Officer - Gymshark | LinkedIn',
            snippet: 'Noel Mack is Chief Brand Officer at Gymshark. Leading global brand marketing and partnerships.',
          },
          {
            url: 'https://www.linkedin.com/in/calumwatson',
            title: 'Calum Watson - Head of Partnerships @ Gymshark | LinkedIn',
            snippet: 'Calum Watson - Head of Partnerships at Gymshark. Managing creator & brand activations.',
          },
          {
            url: 'https://www.linkedin.com/company/gymshark', // Must be ignored: company page, not a person
            title: 'Gymshark: Overview | LinkedIn',
            snippet: 'Gymshark is a British fitness apparel and accessories brand...',
          },
        ];
      },
    };

    const finder = new DecisionMakerFinder(mockProvider);
    const results = await finder.findDecisionMakers('Gymshark');

    assert.strictEqual(results.length, 2, 'Should only return the 2 personal profiles');

    // Profile 1: Noel Mack
    assert.strictEqual(results[0].name, 'Noel Mack');
    assert.strictEqual(results[0].title, 'Chief Brand Officer');
    assert.strictEqual(results[0].linkedinUrl, 'https://uk.linkedin.com/in/noelmack');
    assert.strictEqual(results[0].sourceUrl, 'https://uk.linkedin.com/in/noelmack');
    assert.strictEqual(results[0].email, null, 'Must NOT invent email');
    assert.strictEqual(results[0].verified, true);
    assert.doesNotThrow(() => DecisionMakerV1Schema.parse(results[0]));

    // Profile 2: Calum Watson
    assert.strictEqual(results[1].name, 'Calum Watson');
    assert.strictEqual(results[1].title, 'Head of Partnerships @ Gymshark');
    assert.strictEqual(results[1].linkedinUrl, 'https://www.linkedin.com/in/calumwatson');
    assert.strictEqual(results[1].sourceUrl, 'https://www.linkedin.com/in/calumwatson');
    assert.strictEqual(results[1].email, null);
    assert.strictEqual(results[1].verified, true);
    assert.doesNotThrow(() => DecisionMakerV1Schema.parse(results[1]));
  });

  test('Strict Grounding Rule: Returns empty array when search yields 0 LinkedIn profiles (Zero synthetic contacts)', async () => {
    const mockProvider: ISearchProvider = {
      name: 'mock',
      async search(): Promise<SearchResultItem[]> {
        return [
          {
            url: 'https://example.com/about',
            title: 'About Us',
            snippet: 'Some random text without LinkedIn profiles',
          },
        ];
      },
    };

    const finder = new DecisionMakerFinder(mockProvider);
    const results = await finder.findDecisionMakers('Unknown Startup');

    assert.deepStrictEqual(results, [], 'Grounding Rule: Must not invent contacts when unverified');
  });

  test('Deduplicates multiple results for the same LinkedIn profile URL', async () => {
    const mockProvider: ISearchProvider = {
      name: 'mock',
      async search(): Promise<SearchResultItem[]> {
        return [
          {
            url: 'https://www.linkedin.com/in/noelmack',
            title: 'Noel Mack - Chief Brand Officer - Gymshark | LinkedIn',
            snippet: 'Chief Brand Officer at Gymshark',
          },
          {
            url: 'https://www.linkedin.com/in/noelmack?trk=feed',
            title: 'Noel Mack | LinkedIn',
            snippet: 'Chief Brand Officer',
          },
        ];
      },
    };

    const finder = new DecisionMakerFinder(mockProvider);
    const results = await finder.findDecisionMakers('Gymshark');

    assert.strictEqual(results.length, 1, 'Should deduplicate identical profile URLs');
    assert.strictEqual(results[0].name, 'Noel Mack');
  });

  test('Gracefully handles search provider errors without throwing', async () => {
    const mockProvider: ISearchProvider = {
      name: 'mock',
      async search(): Promise<SearchResultItem[]> {
        throw new Error('Search network failure');
      },
    };

    const finder = new DecisionMakerFinder(mockProvider);
    const results = await finder.findDecisionMakers('Gymshark');

    assert.deepStrictEqual(results, []);
  });
});
