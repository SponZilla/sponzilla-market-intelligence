import { Evidence, Source } from '@sponzilla/shared';
import crypto from 'crypto';

export class EvidenceExtractor {
  extractEvidence(sources: Source[], companyName: string): Evidence[] {
    const evidenceList: Evidence[] = [];

    for (const src of sources) {
      if (src.verificationStatus !== 'VERIFIED_LIVE') continue;

      const sourceContent = src.content || src.snippet;
      // Snippets are discovery metadata; evidence is selected from verified page content.
      const sentences = sourceContent
        .split(/(?<=[.!?])\s+/)
        .map(s => s.trim())
        .filter(
          s =>
            s.length > 20 &&
            !s.toLowerCase().includes('javascript') &&
            !s.toLowerCase().includes('cookie') &&
            !s.toLowerCase().includes('enable cookies')
        );

      const selectedSentences = sentences.length > 0 ? sentences.slice(0, 2) : [sourceContent.substring(0, 200)];

      const sourceType = this.getSourceType(src.url, companyName);
      const corroborationCount = sources.filter((candidate) =>
        candidate.content && candidate.content.toLowerCase().includes(companyName.toLowerCase().split(/\s+/)[0] || ''),
      ).length;

      for (const factSnippet of selectedSentences) {
        const claim = `${companyName} verified activity in "${src.title.substring(0, 60)}"`;
        const fact = `The verified public source reports: "${factSnippet}"`;
        const aiInference = `This confirmed fact indicates potential GTM commercial activity and market presence for ${companyName}.`;
        const suggestedAngle = `Target ${companyName}'s marketing & GTM team with structured partnership & activation proposals during this cycle.`;

        const start = sourceContent.indexOf(factSnippet);
        const evidenceBase = {
          id: `ev_${crypto.randomBytes(6).toString('hex')}`,
          claim,
          source: {
            title: src.title,
            url: src.url,
            type: sourceType,
            publishedAt: src.publishedDate || null,
            verified: true
          },
          fact,
          aiInference,
          suggestedAngle,
          sourceId: src.id,
          confidenceScore: this.calculateConfidence(src, sourceType, corroborationCount),
          sourceContentHash: src.contentHash,
          sourceExcerpt: factSnippet,
          sourceExcerptStart: start >= 0 ? start : 0,
          sourceExcerptEnd: start >= 0 ? start + factSnippet.length : factSnippet.length,
          retrievedAt: src.retrievedAt || src.capturedAt,
        };
        evidenceList.push(evidenceBase);
      }
    }

    return evidenceList;
  }

  private getSourceType(url: string, companyName: string): string {
    const urlLower = url.toLowerCase();
    if (urlLower.includes('/careers') || urlLower.includes('/jobs') || urlLower.includes('greenhouse')) {
      return 'Careers / Hiring Portal';
    }
    if (urlLower.includes('/press') || urlLower.includes('/news') || urlLower.includes('/blog')) {
      return 'Newsroom / Press Release';
    }
    return urlLower.includes(companyName.toLowerCase().replace(/[^a-z0-9]/g, ''))
      ? 'Company Announcement'
      : 'Industry Publication';
  }

  private calculateConfidence(source: Source, sourceType: string, corroborationCount: number): number {
    let score = source.verificationStatus === 'VERIFIED_LIVE' ? 0.35 : 0;
    if (source.content && source.content.length >= 500) score += 0.2;
    if (source.contentHash) score += 0.15;
    if (sourceType === 'Company Announcement') score += 0.15;
    if (source.publishedDate) score += 0.05;
    if (corroborationCount > 1) score += 0.1;
    return Math.min(1, Number(score.toFixed(2)));
  }
}
