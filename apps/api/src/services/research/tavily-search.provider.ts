import {
  ISearchProvider,
  SearchOptions,
  SearchResultItem,
} from './search-provider.interface';

/**
 * Tavily occasionally answers in ~10s. An 8s abort turned slow-but-successful
 * searches into "no sources found", which downstream became
 * NO_VERIFIED_OPPORTUNITY — a false negative in the grounding path.
 */
const REQUEST_TIMEOUT_MS = 20_000;
const MAX_ATTEMPTS = 2;

/** Failure that is safe to retry: timeout, network error, throttling, 5xx. */
class RetryableSearchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RetryableSearchError';
  }
}

function isRetryable(error: unknown): boolean {
  if (error instanceof RetryableSearchError) return true;
  const name = (error as { name?: string } | null)?.name;
  return name === 'TimeoutError' || name === 'AbortError' || error instanceof TypeError;
}

export class TavilySearchProvider implements ISearchProvider {
  readonly name = 'tavily';
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || '';
    if (!this.apiKey) {
      throw new Error(
        'SEARCH_PROVIDER=tavily configured, but TAVILY_API_KEY environment variable is missing.'
      );
    }
  }

  async search(
    query: string,
    _companyName: string,
    options: SearchOptions = {},
  ): Promise<SearchResultItem[]> {
    const results: SearchResultItem[] = [];
    const includeDomains = options.includeDomains?.filter(Boolean) ?? [];

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        const res = await fetch('https://api.tavily.com/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            api_key: this.apiKey,
            query,
            search_depth: 'basic',
            include_answer: false,
            max_results: 10,
            /*
             * Tavily treats `site:` inside the query as ordinary text and
             * ranks loosely, which returned profiles that merely mention the
             * company. Its first-class domain filter is the reliable way to
             * keep results on LinkedIn.
             */
            ...(includeDomains.length > 0 ? { include_domains: includeDomains } : {}),
          }),
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
        });

        if (!res.ok) {
          const errorText = await res.text().catch(() => '');
          const message = `Tavily Search API request failed [${res.status}]: ${errorText}`;
          if (res.status === 429 || res.status >= 500) {
            throw new RetryableSearchError(message);
          }
          throw new Error(message);
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

        return results;
      } catch (err: any) {
        if (!isRetryable(err)) {
          throw err;
        }

        if (attempt < MAX_ATTEMPTS) {
          console.warn(
            `[TavilySearchProvider] Transient failure on attempt ${attempt}/${MAX_ATTEMPTS} for query "${query}":`,
            err?.message || err,
          );
          await new Promise((resolve) => setTimeout(resolve, 1_000 * attempt));
          continue;
        }

        console.error(
          `[TavilySearchProvider] Error searching query "${query}" after ${MAX_ATTEMPTS} attempts:`,
          err?.message || err,
        );
      }
    }

    return results;
  }
}
