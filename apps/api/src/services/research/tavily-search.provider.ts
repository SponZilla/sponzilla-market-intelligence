import { ISearchProvider, SearchResultItem } from './search-provider.interface';

export class TavilySearchProvider implements ISearchProvider {
  readonly name = 'tavily';
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.TAVILY_API_KEY || '';
    if (!this.apiKey) {
      throw new Error(
        'SEARCH_PROVIDER=tavily configured, but TAVILY_API_KEY environment variable is missing. Please set TAVILY_API_KEY or change SEARCH_PROVIDER=duckduckgo.'
      );
    }
  }

  async search(query: string, _companyName: string): Promise<SearchResultItem[]> {
    const results: SearchResultItem[] = [];

    try {
      const res = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: this.apiKey,
          query,
          search_depth: 'basic',
          include_answer: false,
          max_results: 10
        }),
        signal: AbortSignal.timeout(8000)
      });

      if (!res.ok) {
        const errorText = await res.text().catch(() => '');
        throw new Error(`Tavily Search API request failed [${res.status}]: ${errorText}`);
      }

      const data = await res.json();
      if (data.results && Array.isArray(data.results)) {
        for (const item of data.results) {
          if (item.url && typeof item.url === 'string' && item.url.startsWith('http')) {
            results.push({
              url: item.url,
              title: item.title || '',
              snippet: item.content || item.snippet || '',
              publishedDate: item.published_date || null
            });
          }
        }
      }
    } catch (err: any) {
      if (err.message?.includes('TAVILY_API_KEY') || err.message?.includes('failed')) {
        throw err;
      }
      console.error(`[TavilySearchProvider] Error searching query "${query}":`, err?.message || err);
    }

    return results;
  }
}
