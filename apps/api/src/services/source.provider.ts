import { CompanyInput, Source } from '@sponzilla/shared';
import crypto from 'crypto';
import { SourceVerifier } from './source.verifier';
import { getSearchProvider } from './research/search-provider.factory';

export interface ISourceProvider {
  fetchSources(input: CompanyInput): Promise<Source[]>;
}

export function extractDomain(urlStr: string): string {
  try {
    const u = new URL(urlStr.startsWith('http') ? urlStr : `https://${urlStr}`);
    return u.hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return '';
  }
}

export function isCareerUrl(url: string): boolean {
  const lower = url.toLowerCase();
  return (
    lower.includes('career') ||
    lower.includes('careers') ||
    lower.includes('/jobs') ||
    lower.includes('/job/') ||
    lower.includes('jobs.') ||
    lower.includes('greenhouse.io') ||
    lower.includes('lever.co') ||
    lower.includes('workday') ||
    lower.includes('linkedin.com/company/') ||
    lower.includes('linkedin.com/jobs') ||
    lower.includes('job-boards') ||
    lower.includes('recruitment') ||
    lower.includes('work-with-us') ||
    lower.includes('join-our-team') ||
    lower.includes('talent')
  );
}

export function isCareerOrIrrelevantUrl(url: string, companyName: string, companyWebsiteUrl: string): boolean {
  if (isCareerUrl(url)) return true;

  const lowerUrl = url.toLowerCase();

  // Exclude generic administrative / login / policy / search / social media links
  if (
    lowerUrl.includes('google.') ||
    lowerUrl.includes('duckduckgo.') ||
    lowerUrl.includes('bing.com') ||
    lowerUrl.includes('facebook.com') ||
    lowerUrl.includes('twitter.com') ||
    lowerUrl.includes('x.com') ||
    lowerUrl.includes('instagram.com') ||
    lowerUrl.includes('tiktok.com') ||
    lowerUrl.includes('youtube.com') ||
    lowerUrl.includes('/login') ||
    lowerUrl.includes('/privacy') ||
    lowerUrl.includes('/terms') ||
    lowerUrl.includes('/cart') ||
    lowerUrl.includes('/checkout') ||
    lowerUrl.includes('/account') ||
    lowerUrl.includes('/register') ||
    lowerUrl.includes('/signup')
  ) {
    return true;
  }

  // Exclude third-party e-commerce marketplaces / resellers / unrelated aggregators
  const targetDomain = extractDomain(companyWebsiteUrl);
  const candidateDomain = extractDomain(url);

  const isTargetDomain =
    candidateDomain &&
    (candidateDomain === targetDomain ||
      candidateDomain.endsWith('.' + targetDomain) ||
      targetDomain.endsWith('.' + candidateDomain));

  if (!isTargetDomain) {
    const BLACKLISTED_AGGREGATORS = [
      'myntra.com',
      'amazon.',
      'ebay.',
      'flipkart.com',
      'hypefly.co.in',
      'culture-circle.com',
      'sneakflyy.in',
      'walmart.com',
      'target.com',
      'etsy.com',
      'aliexpress.com',
      'poshmark.com',
      'depop.com',
      'stockx.com',
      'goat.com',
      'liquide.life',
      'liquid.trade',
      'chemistrylearner.com'
    ];

    if (BLACKLISTED_AGGREGATORS.some(black => candidateDomain.includes(black))) {
      return true; // Exclude third-party marketplace/reseller/unrelated links
    }
  }

  return false;
}

export class SourceProvider implements ISourceProvider {
  private verifier = new SourceVerifier();

  async fetchSources(input: CompanyInput): Promise<Source[]> {
    const candidateUrls = new Set<string>();
    const companyName = input.companyName.trim();
    const websiteUrl = input.websiteUrl.trim();

    // 1. Add direct company domain & newsroom/press paths (EXCLUDING ALL CAREER / JOB PATHS)
    try {
      const baseUrl = websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`;
      const urlObj = new URL(baseUrl);

      if (!isCareerOrIrrelevantUrl(baseUrl, companyName, websiteUrl)) candidateUrls.add(baseUrl);

      const newsUrl = `${urlObj.origin}/news`;
      const pressUrl = `${urlObj.origin}/press`;
      const aboutUrl = `${urlObj.origin}/about`;
      const blogUrl = `${urlObj.origin}/blog`;

      if (!isCareerOrIrrelevantUrl(newsUrl, companyName, websiteUrl)) candidateUrls.add(newsUrl);
      if (!isCareerOrIrrelevantUrl(pressUrl, companyName, websiteUrl)) candidateUrls.add(pressUrl);
      if (!isCareerOrIrrelevantUrl(aboutUrl, companyName, websiteUrl)) candidateUrls.add(aboutUrl);
      if (!isCareerOrIrrelevantUrl(blogUrl, companyName, websiteUrl)) candidateUrls.add(blogUrl);
    } catch {}

    // 2. Resolve Search Provider via Factory & perform search
    const provider = getSearchProvider();
    console.log(`[SourceProvider] Using search provider: "${provider.name}" for company "${companyName}"`);

    const searchQuery = `${companyName} ${input.category || ''} marketing campaign sponsorship product launch 2024 2025`;
    const searchResults = await provider.search(searchQuery, companyName);

    searchResults.forEach(res => {
      if (res.url && res.url.startsWith('http') && !isCareerOrIrrelevantUrl(res.url, companyName, websiteUrl)) {
        candidateUrls.add(res.url);
      }
    });

    // 3. Verify Reachability, Relevance, and Priority Score for all candidate URLs
    const verifiedCandidates: { source: Source; priorityScore: number }[] = [];
    const now = new Date().toISOString();

    for (const url of candidateUrls) {
      if (isCareerOrIrrelevantUrl(url, companyName, websiteUrl)) continue;

      const verification = await this.verifier.verifyUrl(url, companyName, websiteUrl);
      if (verification.isVerified && verification.snippet.length > 20) {
        verifiedCandidates.push({
          source: {
            id: `src_${crypto.randomBytes(6).toString('hex')}`,
            url: verification.url,
            title: verification.title,
            publishedDate: verification.publishedDate,
            snippet: verification.snippet,
            verificationStatus: 'VERIFIED_LIVE',
            capturedAt: now
          },
          priorityScore: verification.priorityScore
        });
      }
    }

    // Sort by priorityScore descending and return top 6 sources
    verifiedCandidates.sort((a, b) => b.priorityScore - a.priorityScore);
    return verifiedCandidates.slice(0, 6).map(item => item.source);
  }
}
