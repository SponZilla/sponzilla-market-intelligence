import { Evidence, Source } from '@sponzilla/shared';
import crypto from 'crypto';

export class EvidenceExtractor {
  extractEvidence(sources: Source[], companyName: string): Evidence[] {
    const evidenceList: Evidence[] = [];

    for (const src of sources) {
      if (src.verificationStatus !== 'VERIFIED_LIVE') continue;

      // Extract high-value sentences from snippet
      const sentences = src.snippet
        .split(/(?<=[.!?])\s+/)
        .map(s => s.trim())
        .filter(
          s =>
            s.length > 20 &&
            !s.toLowerCase().includes('javascript') &&
            !s.toLowerCase().includes('cookie') &&
            !s.toLowerCase().includes('enable cookies')
        );

      const selectedSentences = sentences.length > 0 ? sentences.slice(0, 2) : [src.snippet.substring(0, 200)];

      for (const factSnippet of selectedSentences) {
        // Determine source type
        let sourceType = 'Company Announcement';
        const urlLower = src.url.toLowerCase();
        if (
          urlLower.includes('/careers') ||
          urlLower.includes('/jobs') ||
          urlLower.includes('greenhouse') ||
          urlLower.includes('linkedin')
        ) {
          sourceType = 'Careers / Hiring Portal';
        } else if (urlLower.includes('/press') || urlLower.includes('/news') || urlLower.includes('/blog')) {
          sourceType = 'Newsroom / Press Release';
        } else if (!urlLower.includes(companyName.toLowerCase().replace(/[^a-z0-9]/g, ''))) {
          sourceType = 'Industry Publication';
        }

        const claim = `${companyName} verified activity in "${src.title.substring(0, 60)}"`;
        const fact = `The verified public source reports: "${factSnippet}"`;
        const aiInference = `This confirmed fact indicates potential GTM commercial activity and market presence for ${companyName}.`;
        const opportunity = `Target ${companyName}'s marketing & GTM team with structured partnership & activation proposals during this cycle.`;

        evidenceList.push({
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
          opportunity,
          sourceId: src.id,
          confidenceScore: 0.95
        });
      }
    }

    return evidenceList;
  }
}
