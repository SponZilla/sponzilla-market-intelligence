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

  test('Drops profiles that only mention the company without stating employment', async () => {
    const mockProvider: ISearchProvider = {
      name: 'mock',
      async search(): Promise<SearchResultItem[]> {
        return [
          {
            url: 'https://www.linkedin.com/in/julianne-garry',
            title: 'Julianne Garry | Chief Marketing Officer - Fractional CMO',
            snippet: 'Fractional CMO. Previously worked with brands such as Strava and Nike.',
          },
          {
            url: 'https://fr.linkedin.com/in/0xabdelstark',
            title: 'Abdelhamid Bakhta - Director of Research Partnerships',
            snippet: 'Ethereum researcher. Cyclist and Strava user.',
          },
          {
            url: 'https://www.linkedin.com/in/paul-fletcher',
            title: 'Paul Fletcher | Focussing on personal objectives for a while',
            snippet: 'Strava athlete and former marketing lead.',
          },
        ];
      },
    };

    const finder = new DecisionMakerFinder(mockProvider);
    const results = await finder.findDecisionMakers('Strava');

    assert.deepStrictEqual(results, [], 'Mentioning the company is not employment at it');
  });

  test('Accepts a profile whose snippet states current employment at the company', async () => {
    const mockProvider: ISearchProvider = {
      name: 'mock',
      async search(): Promise<SearchResultItem[]> {
        return [
          {
            url: 'https://www.linkedin.com/in/sam-rivera',
            title: 'Sam Rivera | LinkedIn',
            snippet: 'Sam Rivera is Head of Partnerships at Strava. Building community programmes.',
          },
        ];
      },
    };

    const finder = new DecisionMakerFinder(mockProvider);
    const results = await finder.findDecisionMakers('Strava');

    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].linkedinUrl, 'https://www.linkedin.com/in/sam-rivera');
    assert.strictEqual(results[0].verified, true);
  });

  test('Rejects a stated employer that is not the target company', async () => {
    const mockProvider: ISearchProvider = {
      name: 'mock',
      async search(): Promise<SearchResultItem[]> {
        return [
          {
            url: 'https://www.linkedin.com/in/laurenpica',
            title: 'Lauren Pica - VP of Marketing @ Grindr',
            snippet: 'VP of Marketing at Grindr. Former marketing lead at Strava.',
          },
        ];
      },
    };

    const finder = new DecisionMakerFinder(mockProvider);
    assert.deepStrictEqual(await finder.findDecisionMakers('Strava'), []);
  });

  test('Rejects past employment at the target company', async () => {
    const mockProvider: ISearchProvider = {
      name: 'mock',
      async search(): Promise<SearchResultItem[]> {
        return [
          {
            url: 'https://www.linkedin.com/in/former-cmo',
            title: 'Sam Lee - CMO - Advisor',
            snippet: 'Former Chief Marketing Officer at Strava (2016 to 2021). Advisor to fitness startups.',
          },
          {
            url: 'https://www.linkedin.com/in/closed-range',
            title: 'Dana White - Head of Partnerships',
            snippet: 'Experience\n- Head of Partnerships at Strava (Jan 2018 to Mar 2021)\n- Advisor at Self Employed',
          },
        ];
      },
    };

    const finder = new DecisionMakerFinder(mockProvider);
    assert.deepStrictEqual(await finder.findDecisionMakers('Strava'), []);
  });

  test('Restricts the search to LinkedIn through the provider option, not query text', async () => {
    const calls: Array<{ query: string; options?: { includeDomains?: string[] } }> = [];
    const mockProvider: ISearchProvider = {
      name: 'mock',
      async search(query, _company, options): Promise<SearchResultItem[]> {
        calls.push({ query, options });
        return [];
      },
    };

    const finder = new DecisionMakerFinder(mockProvider);
    await finder.findDecisionMakers('Gymshark');

    assert.ok(calls.length >= 1);
    for (const call of calls) {
      assert.deepStrictEqual(call.options?.includeDomains, ['linkedin.com']);
      assert.ok(!call.query.includes('site:'), 'site: must not be part of the query');
    }
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
