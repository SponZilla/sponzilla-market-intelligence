import { ISearchProvider } from './search-provider.interface';
import { TavilySearchProvider } from './tavily-search.provider';
import { BraveSearchProvider } from './brave-search.provider';
import { DuckDuckGoSearchProvider } from './duckduckgo-search.provider';
import { BingSearchProvider } from './bing-search.provider';

export function validateSearchProviderConfig(): void {
  const providerType = (process.env.SEARCH_PROVIDER || '').trim().toLowerCase();
  const tavilyApiKey = process.env.TAVILY_API_KEY || '';
  const braveApiKey = process.env.BRAVE_API_KEY || '';

  if (providerType === 'tavily' && !tavilyApiKey) {
    throw new Error(
      'SEARCH_PROVIDER=tavily configured, but TAVILY_API_KEY environment variable is missing.',
    );
  }

  if (providerType === 'brave' && !braveApiKey) {
    throw new Error(
      'SEARCH_PROVIDER=brave configured, but BRAVE_API_KEY environment variable is missing.',
    );
  }

  if (providerType && !['tavily', 'brave', 'duckduckgo', 'bing'].includes(providerType)) {
    throw new Error(
      `Unsupported SEARCH_PROVIDER "${providerType}". Use tavily, brave, duckduckgo, or bing.`,
    );
  }
}

export function getSearchProvider(requestedProvider?: string): ISearchProvider {
  const providerType = (requestedProvider || process.env.SEARCH_PROVIDER || '').toLowerCase().trim();
  const tavilyApiKey = process.env.TAVILY_API_KEY || '';
  const braveApiKey = process.env.BRAVE_API_KEY || '';

  if (providerType === 'tavily') {
    return new TavilySearchProvider(tavilyApiKey);
  }

  if (providerType === 'brave') {
    return new BraveSearchProvider(braveApiKey);
  }

  if (providerType === 'duckduckgo') {
    return new DuckDuckGoSearchProvider();
  }

  if (providerType === 'bing') {
    return new BingSearchProvider();
  }

  // Fallback: If SEARCH_PROVIDER is not set, prefer Tavily if key is available, else DuckDuckGo
  if (tavilyApiKey) {
    return new TavilySearchProvider(tavilyApiKey);
  }

  return new DuckDuckGoSearchProvider();
}
