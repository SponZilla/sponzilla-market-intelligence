import { ISearchProvider, SearchResultItem } from './search-provider.interface';

/**
 * DuckDuckGo's documented Instant Answer API is not a general web-search API.
 * Keep this provider honest; HTML search scraping belongs to a separately
 * named provider with its own terms and parser health checks.
 */
export class DuckDuckGoSearchProvider implements ISearchProvider {
  readonly name = 'duckduckgo';

  async search(query: string, companyName: string): Promise<SearchResultItem[]> {
    const results: SearchResultItem[] = [];

    try {
      const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json`;
      const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (!response.ok) return results;

      const data = await response.json();
      if (typeof data.AbstractURL === 'string' && data.AbstractURL.startsWith('http')) {
        results.push({
          url: data.AbstractURL,
          title: data.Heading || companyName,
          snippet: data.AbstractText || '',
        });
      }

      if (Array.isArray(data.RelatedTopics)) {
        for (const topic of data.RelatedTopics) {
          if (typeof topic.FirstURL === 'string' && topic.FirstURL.startsWith('http')) {
            results.push({
              url: topic.FirstURL,
              title: topic.Text || '',
              snippet: topic.Text || '',
            });
          }
        }
      }
    } catch (error: any) {
      console.error(
        `[DuckDuckGoSearchProvider] API error for query "${query}":`,
        error?.message || error,
      );
    }

    return Array.from(new Map(results.map((result) => [result.url, result])).values());
  }
}
