import { test, describe } from 'node:test';
import assert from 'node:assert';
import { getSearchProvider, validateSearchProviderConfig } from '../../src/services/research/search-provider.factory';
import { TavilySearchProvider } from '../../src/services/research/tavily-search.provider';
import { BraveSearchProvider } from '../../src/services/research/brave-search.provider';
import { DuckDuckGoSearchProvider } from '../../src/services/research/duckduckgo-search.provider';

describe('Search Provider Architecture Unit Tests', () => {
  test('TavilySearchProvider throws error when TAVILY_API_KEY is missing', () => {
    assert.throws(
      () => new TavilySearchProvider(''),
      (err: any) => {
        return err.message.includes('SEARCH_PROVIDER=tavily configured, but TAVILY_API_KEY environment variable is missing');
      }
    );
  });

  test('BraveSearchProvider throws error when BRAVE_API_KEY is missing', () => {
    assert.throws(
      () => new BraveSearchProvider(''),
      (err: any) => {
        return err.message.includes('SEARCH_PROVIDER=brave configured, but BRAVE_API_KEY environment variable is missing');
      }
    );
  });

  test('DuckDuckGoSearchProvider instantiates successfully without API key', () => {
    const ddg = new DuckDuckGoSearchProvider();
    assert.strictEqual(ddg.name, 'duckduckgo');
  });

  test('getSearchProvider resolves requested provider via parameter or environment', () => {
    const ddgProvider = getSearchProvider('duckduckgo');
    assert.strictEqual(ddgProvider.name, 'duckduckgo');
  });

  test('explicit provider validation requires the matching credential', () => {
    const originalProvider = process.env.SEARCH_PROVIDER;
    const originalKey = process.env.TAVILY_API_KEY;

    try {
      process.env.SEARCH_PROVIDER = 'tavily';
      delete process.env.TAVILY_API_KEY;
      assert.throws(() => validateSearchProviderConfig(), /TAVILY_API_KEY/);
    } finally {
      if (originalProvider === undefined) delete process.env.SEARCH_PROVIDER;
      else process.env.SEARCH_PROVIDER = originalProvider;
      if (originalKey === undefined) delete process.env.TAVILY_API_KEY;
      else process.env.TAVILY_API_KEY = originalKey;
    }
  });
});
