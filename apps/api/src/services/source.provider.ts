import { CompanyInput, Source } from '@sponzilla/shared';
import crypto from 'crypto';
import { SourceVerifier } from './source.verifier';

export interface ISourceProvider {
  fetchSources(input: CompanyInput): Promise<Source[]>;
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
    lower.includes('recruitment')
  );
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
      
      if (!isCareerUrl(baseUrl)) candidateUrls.add(baseUrl);
      
      const newsUrl = `${urlObj.origin}/news`;
      const pressUrl = `${urlObj.origin}/press`;
      const aboutUrl = `${urlObj.origin}/about`;
      const blogUrl = `${urlObj.origin}/blog`;

      if (!isCareerUrl(newsUrl)) candidateUrls.add(newsUrl);
      if (!isCareerUrl(pressUrl)) candidateUrls.add(pressUrl);
      if (!isCareerUrl(aboutUrl)) candidateUrls.add(aboutUrl);
      if (!isCareerUrl(blogUrl)) candidateUrls.add(blogUrl);
    } catch {}

    // 2. Perform Live Web Search via DuckDuckGo HTML Endpoint or Search API
    const searchQuery = `${companyName} ${input.category || ''} marketing campaign sponsorship product launch 2024 2025`;
    const searchUrls = await this.performLiveWebSearch(searchQuery, companyName);
    
    searchUrls.forEach(url => {
      if (!isCareerUrl(url)) {
        candidateUrls.add(url);
      }
    });

    // 3. Verify Reachability and Relevance for all non-career candidate URLs
    const verifiedSources: Source[] = [];
    const now = new Date().toISOString();

    for (const url of candidateUrls) {
      if (isCareerUrl(url)) continue;
      if (verifiedSources.length >= 6) break;

      const verification = await this.verifier.verifyUrl(url, companyName);
      if (verification.isVerified && verification.snippet.length > 20) {
        verifiedSources.push({
          id: `src_${crypto.randomBytes(6).toString('hex')}`,
          url: verification.url,
          title: verification.title,
          publishedDate: verification.publishedDate,
          snippet: verification.snippet,
          verificationStatus: 'VERIFIED_LIVE',
          capturedAt: now
        });
      }
    }

    return verifiedSources;
  }

  /**
   * Performs real live web search using DuckDuckGo HTML scraper or process.env search key
   */
  private async performLiveWebSearch(query: string, companyName: string): Promise<string[]> {
    const urls: string[] = [];

    // Optional Tavily Search API Integration
    if (process.env.TAVILY_API_KEY) {
      try {
        const res = await fetch('https://api.tavily.com/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            api_key: process.env.TAVILY_API_KEY,
            query,
            search_depth: 'basic',
            max_results: 6
          }),
          signal: AbortSignal.timeout(6000)
        });
        if (res.ok) {
          const data = await res.json();
          if (data.results && Array.isArray(data.results)) {
            data.results.forEach((r: any) => {
              if (r.url && r.url.startsWith('http') && !isCareerUrl(r.url)) {
                urls.push(r.url);
              }
            });
            if (urls.length > 0) return urls;
          }
        }
      } catch {}
    }

    // Live Free DuckDuckGo HTML Search Scraper
    try {
      const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
      const res = await fetch(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
        },
        signal: AbortSignal.timeout(6000)
      });

      if (res.ok) {
        const html = await res.text();
        const uddgMatches = html.matchAll(/uddg=([^&"']+)/g);
        for (const match of uddgMatches) {
          try {
            const decodedUrl = decodeURIComponent(match[1]);
            if (decodedUrl.startsWith('http') && !decodedUrl.includes('duckduckgo.com') && !decodedUrl.includes('google.com') && !isCareerUrl(decodedUrl)) {
              urls.push(decodedUrl);
            }
          } catch {}
        }
      }
    } catch {}

    return urls;
  }
}
