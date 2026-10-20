import { DecisionMakerV1, DecisionMakerV1Schema } from '@sponzilla/shared';
import { ISearchProvider, SearchResultItem } from './search-provider.interface';
import { getSearchProvider } from './search-provider.factory';

export interface IDecisionMakerFinder {
  findDecisionMakers(companyName: string): Promise<DecisionMakerV1[]>;
}

export class DecisionMakerFinder implements IDecisionMakerFinder {
  constructor(private searchProvider?: ISearchProvider) {}

  /**
   * Discovers and extracts real, source-grounded LinkedIn decision-maker profiles.
   * Adheres strictly to the SponZilla Grounding Rule: NEVER invent or hallucinate contacts.
   * Only profiles returned from live public search results with valid linkedin.com/in URLs are returned.
   */
  async findDecisionMakers(companyName: string): Promise<DecisionMakerV1[]> {
    const cleanedCompany = companyName.trim();
    if (!cleanedCompany) return [];

    let provider: ISearchProvider;
    try {
      provider = this.searchProvider || getSearchProvider();
    } catch (err: any) {
      console.warn(`[DecisionMakerFinder] Search provider unavailable:`, err?.message || err);
      return [];
    }

    // Targeted query for partnership, marketing, and brand decision-makers
    const query = `site:linkedin.com/in "${cleanedCompany}" ("Head of Partnerships" OR "VP Marketing" OR "Brand Director" OR "Partnerships Director" OR "Chief Marketing Officer")`;

    let results: SearchResultItem[] = [];
    try {
      results = await provider.search(query, cleanedCompany);
    } catch (err: any) {
      console.warn(`[DecisionMakerFinder] Search query failed for "${cleanedCompany}":`, err?.message || err);
      return [];
    }

    return this.parseDecisionMakers(results, cleanedCompany);
  }

  /**
   * Parses and validates decision-makers from search results.
   */
  parseDecisionMakers(results: SearchResultItem[], companyName: string): DecisionMakerV1[] {
    const decisionMakers: DecisionMakerV1[] = [];
    const seenUrls = new Set<string>();

    const LINKEDIN_PROFILE_REGEX = /^https?:\/\/(?:[a-z]{2,3}\.)?linkedin\.com\/in\/([a-zA-Z0-9_\-%]+)/i;

    for (const item of results) {
      if (!item.url) continue;

      const match = item.url.match(LINKEDIN_PROFILE_REGEX);
      if (!match) continue; // Skip non-profile URLs (e.g. linkedin.com/company/, /pulse/, /jobs/)

      // Canonical profile URL (strip query parameters and trailing slashes)
      const cleanUrl = item.url.split('?')[0].replace(/\/+$/, '');
      if (seenUrls.has(cleanUrl.toLowerCase())) continue;
      seenUrls.add(cleanUrl.toLowerCase());

      const { name, title } = this.extractNameAndTitle(item.title || '', item.snippet || '', companyName);

      const candidate: DecisionMakerV1 = {
        name: name || null,
        title: title || null,
        linkedinUrl: cleanUrl,
        email: null, // Zero email fabrication
        sourceUrl: cleanUrl, // FACT provenance
        verified: true,
      };

      const parsed = DecisionMakerV1Schema.safeParse(candidate);
      if (parsed.success) {
        decisionMakers.push(parsed.data);
      }
    }

    // Return top 5 verified profiles
    return decisionMakers.slice(0, 5);
  }

  /**
   * Extracts person name and business title from search result title/snippet.
   * Typical title patterns:
   * - "Noel Mack - Chief Brand Officer - Gymshark | LinkedIn"
   * - "Calum Watson - Head of Partnerships @ Gymshark | LinkedIn"
   * - "Jane Doe – VP Marketing – Gymshark | LinkedIn"
   * - "John Doe | Head of Partnerships | LinkedIn"
   */
  private extractNameAndTitle(
    rawTitle: string,
    rawSnippet: string,
    companyName: string
  ): { name: string | null; title: string | null } {
    let name: string | null = null;
    let title: string | null = null;

    // Clean title: remove "| LinkedIn", "- LinkedIn", etc.
    const cleanedTitle = rawTitle
      .replace(/\s*(?:\||-|–|—)\s*LinkedIn.*$/i, '')
      .trim();

    // Split by standard delimiters
    const parts = cleanedTitle.split(/\s*(?:[-–—|:])\s*/);

    if (parts.length >= 3) {
      const candidateName = parts[0].trim();
      if (this.isValidPersonName(candidateName, companyName)) {
        name = candidateName;
      }
      // If 3rd part is the company name, part 1 is the role title
      if (parts[2].toLowerCase().includes(companyName.toLowerCase())) {
        title = parts[1].trim();
      } else {
        title = `${parts[1].trim()} - ${parts[2].trim()}`;
      }
    } else if (parts.length === 2) {
      const candidateName = parts[0].trim();
      if (this.isValidPersonName(candidateName, companyName)) {
        name = candidateName;
      }
      title = parts[1].trim();
    } else if (parts.length === 1 && parts[0]) {
      if (this.isValidPersonName(parts[0], companyName)) {
        name = parts[0];
      }
    }

    // If title was not extracted or is empty, inspect snippet
    if (!title && rawSnippet) {
      title = this.extractTitleFromSnippet(rawSnippet, companyName);
    }

    return { name, title };
  }

  private isValidPersonName(candidate: string, companyName: string): boolean {
    if (!candidate || candidate.length < 2 || candidate.length > 50) return false;
    const lower = candidate.toLowerCase();
    const lowerCompany = companyName.toLowerCase();

    // Must not be the company name or generic website strings
    if (lower === lowerCompany || lower.includes('linkedin') || lower.includes('profile')) {
      return false;
    }

    // A person's name is typically 1 to 4 words
    const words = candidate.split(/\s+/);
    return words.length >= 1 && words.length <= 4;
  }

  private extractTitleFromSnippet(snippet: string, companyName: string): string | null {
    const roleRegex = /(?:is (?:the )?|working as (?:a |the )?|(?:^|\.\s*))([A-Z][a-zA-Z\s&/]{2,40}(?:Partnership|Marketing|Brand|Sponsorship|Director|Officer|Lead|Manager|VP|Vice President)[a-zA-Z\s&/]*)/i;
    const match = snippet.match(roleRegex);
    if (match && match[1]) {
      return match[1].trim();
    }
    return null;
  }
}

export const decisionMakerFinder = new DecisionMakerFinder();
