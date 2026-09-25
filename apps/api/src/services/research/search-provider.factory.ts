import { ISearchProvider } from './search-provider.interface';
import { TavilySearchProvider } from './tavily-search.provider';
import { BraveSearchProvider } from './brave-search.provider';
import { DuckDuckGoSearchProvider } from './duckduckgo-search.provider';

export function getSearchProvider(requestedProvider?: string): ISearchProvider {
  const providerType = (requestedProvider || process.env.SEARCH_PROVIDER || '').toLowerCase().trim();

  if (providerType === 'tavily') {
    return new TavilySearchProvider();
  }

  if (providerType === 'brave') {
    return new BraveSearchProvider();
  }

  if (providerType === 'duckduckgo') {
    return new DuckDuckGoSearchProvider();
  }

  // Fallback: If SEARCH_PROVIDER is not set, prefer Tavily if key is available, else DuckDuckGo
  if (process.env.TAVILY_API_KEY) {
    return new TavilySearchProvider();
  }

  return new DuckDuckGoSearchProvider();
}
