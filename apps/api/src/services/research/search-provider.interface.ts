export interface SearchResultItem {
  url: string;
  title?: string;
  snippet?: string;
  publishedDate?: string | null;
}

export interface ISearchProvider {
  name: string;
  /**
   * Restrict results to these hosts when the provider supports it. Providers
   * that only understand query syntax apply it as a `site:` restriction.
   */
  search(
    query: string,
    companyName: string,
    options?: SearchOptions
  ): Promise<SearchResultItem[]>;
}

export interface SearchOptions {
  includeDomains?: string[];
}
