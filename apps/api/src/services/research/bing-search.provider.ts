import { ISearchProvider, SearchResultItem } from './search-provider.interface';

/**
 * Explicitly named compatibility provider for environments that accept Bing
 * HTML retrieval. It is never selected by the production default.
 */
export class BingSearchProvider implements ISearchProvider {
  readonly name = 'bing';

  async search(query: string): Promise<SearchResultItem[]> {
    try {
      const response = await fetch(
        `https://www.bing.com/search?q=${encodeURIComponent(query)}`,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; SponZillaResearch/1.0)',
            Accept: 'text/html,application/xhtml+xml',
          },
          signal: AbortSignal.timeout(6000),
        },
      );
      if (!response.ok) return [];

      const html = await response.text();
      const results: SearchResultItem[] = [];
      for (const block of html.split(/<li class="b_algo"/i).slice(1)) {
        const href = block.match(/href="(https?:\/\/[^"\s]+)"/i)?.[1];
        if (!href || /(?:bing|microsoft|msn)\.com/i.test(href)) continue;
        results.push({
          url: href,
          title: block.match(/<h2[^>]*><a[^>]*>([^<]+)<\/a>/i)?.[1]?.trim() || '',
          snippet: block.match(/<p[^>]*>([\s\S]*?)<\/p>/i)?.[1]?.replace(/<[^>]+>/g, '').trim() || '',
        });
      }
      return results;
    } catch (error: any) {
      console.error(`[BingSearchProvider] Error searching "${query}":`, error?.message || error);
      return [];
    }
  }
}
