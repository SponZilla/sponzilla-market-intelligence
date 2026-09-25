export interface SearchResultItem {
  url: string;
  title?: string;
  snippet?: string;
  publishedDate?: string | null;
}

export interface ISearchProvider {
  name: string;
  search(query: string, companyName: string): Promise<SearchResultItem[]>;
}
