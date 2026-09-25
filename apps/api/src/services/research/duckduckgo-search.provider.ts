import { ISearchProvider, SearchResultItem } from './search-provider.interface';

export class DuckDuckGoSearchProvider implements ISearchProvider {
  readonly name = 'duckduckgo';

  async search(query: string, companyName: string): Promise<SearchResultItem[]> {
    const results: SearchResultItem[] = [];

    // 1. Primary: Bing Search Scraper (Robust, returns 200 OK without API key)
    try {
      const bingUrl = `https://www.bing.com/search?q=${encodeURIComponent(query)}`;
      const res = await fetch(bingUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9'
        },
        signal: AbortSignal.timeout(6000)
      });

      if (res.ok) {
        const html = await res.text();
        
        // Extract links from Bing <cite> tags & <a href="...">
        const citeMatches = Array.from(html.matchAll(/<cite>([^<]+)<\/cite>/gi));
        for (const m of citeMatches) {
          const rawUrl = m[1].replace(/\s*›\s*/g, '/').trim();
          const cleanUrl = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`;
          try {
            const parsed = new URL(cleanUrl);
            if (
              !parsed.hostname.includes('bing.com') &&
              !parsed.hostname.includes('microsoft.com') &&
              !parsed.hostname.includes('msn.com')
            ) {
              results.push({ url: parsed.origin + parsed.pathname });
            }
          } catch {}
        }

        // Also extract raw hrefs from b_algo blocks
        const bAlgoBlocks = html.split(/<li class="b_algo"/i);
        for (const block of bAlgoBlocks.slice(1)) {
          const hrefMatch = block.match(/href="(https?:\/\/[^"]+)"/i);
          const titleMatch = block.match(/<h2[^>]*><a[^>]*>([^<]+)<\/a>/i);
          const snippetMatch = block.match(/<p[^>]*>([\s\S]*?)<\/p>/i);

          if (hrefMatch && hrefMatch[1]) {
            const url = hrefMatch[1];
            if (!url.includes('bing.com') && !url.includes('microsoft.com')) {
              results.push({
                url,
                title: titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : '',
                snippet: snippetMatch ? snippetMatch[1].replace(/<[^>]+>/g, '').trim() : ''
              });
            }
          }
        }
      }
    } catch (err: any) {
      console.error(`[DuckDuckGoSearchProvider] Bing fallback error for query "${query}":`, err?.message || err);
    }

    // 2. Secondary: DDG Instant Answer API
    if (results.length === 0) {
      try {
        const ddgApiUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json`;
        const res = await fetch(ddgApiUrl, { signal: AbortSignal.timeout(5000) });
        if (res.ok) {
          const data = await res.json();
          if (data.AbstractURL && data.AbstractURL.startsWith('http')) {
            results.push({
              url: data.AbstractURL,
              title: data.Heading || companyName,
              snippet: data.AbstractText || ''
            });
          }
          if (data.RelatedTopics && Array.isArray(data.RelatedTopics)) {
            data.RelatedTopics.forEach((t: any) => {
              if (t.FirstURL && t.FirstURL.startsWith('http')) {
                results.push({
                  url: t.FirstURL,
                  title: t.Text || '',
                  snippet: t.Text || ''
                });
              }
            });
          }
        }
      } catch (err: any) {
        console.error(`[DuckDuckGoSearchProvider] DDG API fallback error for query "${query}":`, err?.message || err);
      }
    }

    // Deduplicate candidate URLs by URL string
    const uniqueMap = new Map<string, SearchResultItem>();
    results.forEach(r => {
      if (r.url && !uniqueMap.has(r.url)) {
        uniqueMap.set(r.url, r);
      }
    });

    return Array.from(uniqueMap.values());
  }
}
