import { isCareerUrl } from './source.provider';

export interface VerifiedSourceResult {
  isVerified: boolean;
  url: string;
  title: string;
  snippet: string;
  publishedDate: string | null;
}

export class SourceVerifier {
  /**
   * Verifies that a candidate URL is live (200 OK) and contains content relevant to companyName (strictly excluding career links)
   */
  async verifyUrl(candidateUrl: string, companyName: string): Promise<VerifiedSourceResult> {
    try {
      // 1. Strict Career & Job Link Check
      if (isCareerUrl(candidateUrl)) {
        return { isVerified: false, url: candidateUrl, title: '', snippet: '', publishedDate: null };
      }

      const parsedUrl = new URL(candidateUrl);
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        return { isVerified: false, url: candidateUrl, title: '', snippet: '', publishedDate: null };
      }

      const res = await fetch(candidateUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        },
        signal: AbortSignal.timeout(6000)
      });

      if (!res.ok) {
        return { isVerified: false, url: candidateUrl, title: '', snippet: '', publishedDate: null };
      }

      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('text/html') && !contentType.includes('xml') && !contentType.includes('json') && !contentType.includes('text/plain')) {
        return { isVerified: false, url: candidateUrl, title: '', snippet: '', publishedDate: null };
      }

      const html = await res.text();
      if (!html || html.length < 50) {
        return { isVerified: false, url: candidateUrl, title: '', snippet: '', publishedDate: null };
      }

      // Extract HTML Title
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      let title = titleMatch ? titleMatch[1].trim() : parsedUrl.hostname;
      title = title.replace(/\s+/g, ' ').substring(0, 150);

      // Check title for career indicators
      const titleLower = title.toLowerCase();
      if (titleLower.includes('career') || titleLower.includes('job application') || titleLower.includes('jobs at') || titleLower.includes('work with us')) {
        return { isVerified: false, url: candidateUrl, title: '', snippet: '', publishedDate: null };
      }

      // Extract meta description or initial paragraph snippet
      const metaDescMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i) ||
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
        
        snippet = cleanText.substring(0, 300);
      }

      // Extract publication date if available
      const dateMatch = html.match(/"datePublished":\s*"([^"]+)"/i) ||
                        html.match(/<meta[^>]*property=["']article:published_time["'][^>]*content=["']([^"']+)["']/i);
      const publishedDate = dateMatch ? dateMatch[1].split('T')[0] : null;

      // Verify relevance: title, domain, or snippet must contain companyName keywords
      const companyKeywords = companyName.toLowerCase().split(/\s+/).filter(k => k.length > 2);
      const textToSearch = (title + ' ' + snippet + ' ' + parsedUrl.hostname).toLowerCase();

      const isRelevant = companyKeywords.some(kw => textToSearch.includes(kw)) || parsedUrl.hostname.toLowerCase().includes(companyKeywords[0] || '');

      if (!isRelevant) {
        return { isVerified: false, url: candidateUrl, title: '', snippet: '', publishedDate: null };
      }

      return {
        isVerified: true,
        url: candidateUrl,
        title: title || `${companyName} Verified Source`,
        snippet: snippet.substring(0, 400),
        publishedDate
      };
    } catch {
      return { isVerified: false, url: candidateUrl, title: '', snippet: '', publishedDate: null };
    }
  }
}
