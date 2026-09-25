import { test, describe } from 'node:test';
import assert from 'node:assert';
import { getSearchProvider } from '../../src/services/research/search-provider.factory';
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
});
