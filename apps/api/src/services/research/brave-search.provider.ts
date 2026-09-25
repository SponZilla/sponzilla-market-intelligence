import { ISearchProvider, SearchResultItem } from './search-provider.interface';

export class BraveSearchProvider implements ISearchProvider {
  readonly name = 'brave';
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.BRAVE_API_KEY || '';
    if (!this.apiKey) {
      throw new Error(
        'SEARCH_PROVIDER=brave configured, but BRAVE_API_KEY environment variable is missing. Please set BRAVE_API_KEY or change SEARCH_PROVIDER=duckduckgo.'
      );
    }
  }

  async search(query: string, _companyName: string): Promise<SearchResultItem[]> {
    const results: SearchResultItem[] = [];

    try {
      const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=10`;
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'X-Subscription-Token': this.apiKey
        },
        signal: AbortSignal.timeout(8000)
      });

      if (!res.ok) {
        const errorText = await res.text().catch(() => '');
        throw new Error(`Brave Search API request failed [${res.status}]: ${errorText}`);
      }

      const data = await res.json();
      const webResults = data.web?.results;
      if (webResults && Array.isArray(webResults)) {
        for (const item of webResults) {
          if (item.url && typeof item.url === 'string' && item.url.startsWith('http')) {
            results.push({
              url: item.url,
              title: item.title || '',
              snippet: item.description || '',
              publishedDate: item.page_age || null
            });
          }
        }
      }
    } catch (err: any) {
      if (err.message?.includes('BRAVE_API_KEY') || err.message?.includes('failed')) {
        throw err;
      }
      console.error(`[BraveSearchProvider] Error searching query "${query}":`, err?.message || err);
    }

    return results;
  }
}
