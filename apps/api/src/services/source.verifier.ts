import { isCareerOrIrrelevantUrl, extractDomain } from './source.provider';
import { DateExtractor } from './date.extractor';

export interface VerifiedSourceResult {
  isVerified: boolean;
  url: string;
  title: string;
  snippet: string;
  publishedDate: string | null;
  priorityScore: number;
}

const REPUTABLE_MEDIA_DOMAINS = [
  'prnewswire.com',
  'businesswire.com',
  'reuters.com',
  'bloomberg.com',
  'techcrunch.com',
  'adweek.com',
  'adage.com',
  'forbes.com',
  'wsj.com',
  'ft.com',
  'cnbc.com',
  'esports.net',
  'esportsadvocate.net',
  'fnatic.com',
  'wikipedia.org',
  'retail-week.com',
  'marketingweek.com',
  'theverge.com',
  'businessinsider.com',
  'fashionunited.com',
  'ampverse.com',
  'etruesports.com',
  'advice4media.com',
  'amworldgroup.com'
];

export class SourceVerifier {
  /**
   * Verifies that a candidate URL is live (200 OK), relevant to companyName, and not an irrelevant third-party or career link
   */
  async verifyUrl(
    candidateUrl: string,
    companyName: string,
    companyWebsiteUrl: string = ''
  ): Promise<VerifiedSourceResult> {
    const unverified: VerifiedSourceResult = {
      isVerified: false,
      url: candidateUrl,
      title: '',
      snippet: '',
      publishedDate: null,
      priorityScore: 0
    };

    try {
      // 1. Strict Career, Irrelevant, Marketplace & Reseller Check
      if (isCareerOrIrrelevantUrl(candidateUrl, companyName, companyWebsiteUrl)) {
        return unverified;
      }

      const parsedUrl = new URL(candidateUrl);
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        return unverified;
      }

      const candidateDomain = extractDomain(candidateUrl);
      const targetDomain = companyWebsiteUrl ? extractDomain(companyWebsiteUrl) : '';
      const isOfficialDomain =
        targetDomain &&
        (candidateDomain === targetDomain ||
          candidateDomain.endsWith('.' + targetDomain) ||
          targetDomain.endsWith('.' + candidateDomain));

      const isReputableMedia = REPUTABLE_MEDIA_DOMAINS.some(media => candidateDomain.includes(media));

      // STRICT DOMAIN GUARD: Must be either official company domain or recognized reputable media outlet
      if (!isOfficialDomain && !isReputableMedia) {
        // If not official domain or recognized press outlet, verify clean company slug in hostname or reject
        const cleanCompanySlug = companyName.toLowerCase().replace(/[^a-z0-9]/g, '');
        const hasSlugInHostname = cleanCompanySlug.length > 2 && candidateDomain.includes(cleanCompanySlug);
        if (!hasSlugInHostname) {
          return unverified;
        }
      }

      const res = await fetch(candidateUrl, {
        method: 'GET',
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9'
        },
        signal: AbortSignal.timeout(6000)
      });

      if (!res.ok) {
        return unverified;
      }

      const contentType = res.headers.get('content-type') || '';
      if (
        !contentType.includes('text/html') &&
        !contentType.includes('xml') &&
        !contentType.includes('json') &&
        !contentType.includes('text/plain')
      ) {
        return unverified;
      }

      const html = await res.text();
      if (!html || html.length < 50) {
        return unverified;
      }

      // Extract HTML Title
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      let title = titleMatch ? titleMatch[1].trim() : parsedUrl.hostname;
      title = title.replace(/\s+/g, ' ').substring(0, 150);

      // Check title for career indicators
      const titleLower = title.toLowerCase();
      if (
        titleLower.includes('career') ||
        titleLower.includes('job application') ||
        titleLower.includes('jobs at') ||
        titleLower.includes('work with us')
      ) {
        return unverified;
      }

      // Extract meta description or initial paragraph snippet
      const metaDescMatch =
        html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i) ||
        html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);

      let snippet = metaDescMatch ? metaDescMatch[1].trim() : '';

      if (!snippet) {
        // Fallback: extract clean text paragraphs
        const cleanText = html
          .replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, '')
          .replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();

        snippet = cleanText.substring(0, 400);
      }

      // Extract publication date & recency
      const recencyInfo = DateExtractor.extractDate(html);

      // Verify relevance: title, domain, or snippet must explicitly contain companyName keywords
      const companyKeywords = companyName.toLowerCase().split(/\s+/).filter(k => k.length > 2);
      const textToSearch = (title + ' ' + snippet + ' ' + parsedUrl.hostname).toLowerCase();

      const isRelevant =
        companyKeywords.some(kw => textToSearch.includes(kw)) ||
        parsedUrl.hostname.toLowerCase().includes(companyKeywords[0] || '');

      if (!isRelevant) {
        return unverified;
      }

      // Calculate Priority Score:
      // Official company domain: 100
      // Official newsroom/press: 90
      // Reputable media: 75
      let priorityScore = 50;

      if (isOfficialDomain) {
        const pathname = parsedUrl.pathname.toLowerCase();
        if (pathname.includes('/news') || pathname.includes('/press')) {
          priorityScore = 90;
        } else if (pathname.includes('/blog') || pathname.includes('/about')) {
          priorityScore = 80;
        } else {
          priorityScore = 100;
        }
      } else if (isReputableMedia) {
        priorityScore = 75;
      }

      return {
        isVerified: true,
        url: candidateUrl,
        title: title || `${companyName} Verified Source`,
        snippet: snippet.substring(0, 500),
        publishedDate: recencyInfo.publishedDate,
        priorityScore
      };
    } catch {
      return unverified;
    }
  }
}
