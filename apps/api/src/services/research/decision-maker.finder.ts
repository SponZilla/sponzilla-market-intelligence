import { DecisionMakerV1, DecisionMakerV1Schema } from '@sponzilla/shared';
import { ISearchProvider, SearchResultItem } from './search-provider.interface';
import { getSearchProvider } from './search-provider.factory';

/**
 * A headline such as "Focussing on personal objectives for a while" is not a
 * role we can act on. Titles must contain a function word that maps to how
 * organisations actually name partnership and marketing owners.
 */
const ROLE_TITLE_PATTERN =
  /(partnership|marketing|brand|sponsor|commercial|business development|director|officer|manager|lead|head of|vice president|\bvp\b|founder|\bceo\b|\bcmo\b|chief)/i;

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

    /*
     * The restriction to LinkedIn is a provider option, not query text: a
     * `site:` prefix inside a semantic query is read as ordinary words and
     * returned profiles that only mention the company.
     */
    const queries = [
      `"${cleanedCompany}" partnerships OR "brand director" OR "head of marketing" OR "chief marketing officer" LinkedIn`,
      `"${cleanedCompany}" "brand partnerships" LinkedIn profile`,
    ];

    const collected: SearchResultItem[] = [];
    const seen = new Set<string>();

    for (const query of queries) {
      let results: SearchResultItem[] = [];
      try {
        results = await provider.search(query, cleanedCompany, {
          includeDomains: ['linkedin.com'],
        });
      } catch (err: any) {
        console.warn(`[DecisionMakerFinder] Search query failed for "${cleanedCompany}":`, err?.message || err);
        continue;
      }

      for (const item of results) {
        if (!item.url || seen.has(item.url)) continue;
        seen.add(item.url);
        collected.push(item);
      }

      /* A second query costs a search credit; stop once we have people. */
      if (this.hasLinkedInProfile(collected) && collected.length >= 5) break;
    }

    return this.parseDecisionMakers(collected, cleanedCompany);
  }

  private hasLinkedInProfile(results: SearchResultItem[]): boolean {
    return results.some((item) => /linkedin\.com\/in\//i.test(item.url));
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

      /*
       * A LinkedIn profile that merely mentions the company is not a target:
       * search engines match the name anywhere on the page, which surfaces
       * past employers, customers and unrelated namesakes. Only keep profiles
       * whose result text states current employment at the company, and only
       * when the extracted title is a real role.
       */
      if (!this.hasEmploymentEvidence(item, companyName)) continue;

      const { name, title } = this.extractNameAndTitle(item.title || '', item.snippet || '', companyName);

      if (!title || !ROLE_TITLE_PATTERN.test(title)) continue;

      seenUrls.add(cleanUrl.toLowerCase());

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

  /**
   * Employment evidence: the company must appear where an employer appears —
   * in the result title beside the role ("Name - Head of Partnerships - Acme
   * | LinkedIn", "Name - Head of Partnerships @ Acme") or in the snippet
   * directly after an employment cue ("at Acme", "@ Acme", "Experience: Acme").
   */
  private hasEmploymentEvidence(item: SearchResultItem, companyName: string): boolean {
    const company = companyName.trim();
    if (!company) return false;

    const escaped = company.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const atCompany = new RegExp(`\\b${escaped}\\b`, 'i');

    const titleWithoutLinkedIn = (item.title || '').replace(
      /\s*(?:\||-|–|—)\s*LinkedIn.*$/i,
      ''
    );
    const titleParts = titleWithoutLinkedIn
      .split(/\s*(?:[-–—|@])\s*/)
      .map((part) => part.trim())
      .filter(Boolean);

    if (titleParts.slice(1).some((part) => atCompany.test(part))) {
      return true;
    }

    const snippet = item.snippet || '';
    if (!snippet) return false;

    /*
     * A stated employer that is not this company means the match came from a
     * past role or a mention, e.g. "VP of Marketing @ Grindr" surfacing for
     * Strava because the profile lists Strava elsewhere.
     */
    const otherEmployer = titleWithoutLinkedIn.match(
      /(?:\bat\s+|@\s*)([A-Z][^@|\-–—]{1,40})$/i
    )?.[1]?.trim();

    if (otherEmployer && !atCompany.test(otherEmployer)) {
      return false;
    }

    /* Past employment is not a way in: reject "Former …" and closed date ranges. */
    const formerHint = new RegExp(
      `(?:\\bformer\\b|\\bpreviously\\b|\\bex-)[^.\\n]{0,40}\\b${escaped}\\b`,
      'i'
    );

    if (formerHint.test(item.title || '') || formerHint.test(snippet)) {
      return false;
    }

    const closedDateRange = new RegExp(
      `${escaped}[^.\\n]{0,60}\\((?:[A-Z][a-z]{2,8}\\.?\\s+)?\\d{4}\\s*(?:-|–|to)\\s*(?!present|now)(?:[A-Z][a-z]{2,8}\\.?\\s+)?\\d{4}\\)`,
      'i'
    );

    if (closedDateRange.test(snippet)) {
      return false;
    }

    const employmentCue = new RegExp(
      `(?:\\bat\\s+|@\\s*|\\bworks?\\s+(?:at|for)\\s+|\\bexperience:?\\s*)${escaped}\\b`,
      'i'
    );

    return employmentCue.test(snippet);
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
