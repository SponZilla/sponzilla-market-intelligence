export interface RecencyResult {
  publishedDate: string | null;
  recency: 'recent' | 'older' | 'unknown';
}

export class DateExtractor {
  /**
   * Extracts a valid ISO publication date string (YYYY-MM-DD) from HTML or text snippet
   */
  static extractDate(htmlOrText: string, searchResultDate?: string | null): RecencyResult {
    if (searchResultDate) {
      const parsed = DateExtractor.parseDateString(searchResultDate);
      if (parsed) {
        return {
          publishedDate: parsed,
          recency: DateExtractor.calculateRecency(parsed)
        };
      }
    }

    if (!htmlOrText) {
      return { publishedDate: null, recency: 'unknown' };
    }

    // 1. JSON-LD datePublished / dateModified
    const jsonLdMatch =
      htmlOrText.match(/"datePublished":\s*"([^"]+)"/i) ||
      htmlOrText.match(/"dateCreated":\s*"([^"]+)"/i) ||
      htmlOrText.match(/"dateModified":\s*"([^"]+)"/i);
    if (jsonLdMatch && jsonLdMatch[1]) {
      const parsed = DateExtractor.parseDateString(jsonLdMatch[1]);
      if (parsed) {
        return { publishedDate: parsed, recency: DateExtractor.calculateRecency(parsed) };
      }
    }

    // 2. Meta tags (article:published_time, pubdate, etc)
    const metaMatch =
      htmlOrText.match(/<meta[^>]*property=["']article:published_time["'][^>]*content=["']([^"']+)["']/i) ||
      htmlOrText.match(/<meta[^>]*name=["']pubdate["'][^>]*content=["']([^"']+)["']/i) ||
      htmlOrText.match(/<meta[^>]*name=["']publishdate["'][^>]*content=["']([^"']+)["']/i);
    if (metaMatch && metaMatch[1]) {
      const parsed = DateExtractor.parseDateString(metaMatch[1]);
      if (parsed) {
        return { publishedDate: parsed, recency: DateExtractor.calculateRecency(parsed) };
      }
    }

    // 3. Regex for YYYY-MM-DD in text
    const isoMatch = htmlOrText.match(/\b(202[0-9])-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])\b/);
    if (isoMatch) {
      return { publishedDate: isoMatch[0], recency: DateExtractor.calculateRecency(isoMatch[0]) };
    }

    // Month Name DD, YYYY (e.g. Jan 15, 2025 or January 15, 2025)
    const textDateMatch = htmlOrText.match(
      /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+([0-9]{1,2}),?\s+(202[0-9])\b/i
    );
    if (textDateMatch) {
      const parsed = DateExtractor.parseDateString(`${textDateMatch[1]} ${textDateMatch[2]}, ${textDateMatch[3]}`);
      if (parsed) {
        return { publishedDate: parsed, recency: DateExtractor.calculateRecency(parsed) };
      }
    }

    return { publishedDate: null, recency: 'unknown' };
  }

  private static parseDateString(dateStr: string): string | null {
    try {
      const clean = dateStr.trim();
      if (/^\d{4}-\d{2}-\d{2}/.test(clean)) {
        return clean.substring(0, 10);
      }
      const d = new Date(clean);
      if (!isNaN(d.getTime())) {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
      }
    } catch {}
    return null;
  }

  private static calculateRecency(isoDate: string): 'recent' | 'older' | 'unknown' {
    try {
      const pubTime = new Date(isoDate).getTime();
      const nowTime = Date.now();
      const daysDiff = (nowTime - pubTime) / (1000 * 3600 * 24);

      if (daysDiff <= 730) return 'recent';
      return 'older';
    } catch {
      return 'unknown';
    }
  }
}
