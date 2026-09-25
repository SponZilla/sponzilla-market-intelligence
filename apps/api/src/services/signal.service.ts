import { Evidence, Signal, SignalType } from '@sponzilla/shared';
import crypto from 'crypto';

interface SignalPattern {
  type: SignalType;
  keywords: string[];
  titleTemplate: (company: string) => string;
}

const SIGNAL_PATTERNS: SignalPattern[] = [
  {
    type: 'product_launch',
    keywords: ['launch', 'unveil', 'roll out', 'new product', 'new feature', 'announce', 'release', 'introduce', 'drop'],
    titleTemplate: (co) => `Product Launch Signal for ${co}`
  },
  {
    type: 'store_opening',
    keywords: ['flagship', 'store opening', 'retail hub', 'soho', 'grand opening', 'opening', 'retail store'],
    titleTemplate: (co) => `Store Opening Signal for ${co}`
  },
  {
    type: 'regional_expansion',
    keywords: ['regional', 'statewide', 'nationwide', 'expand', 'expansion', 'region', 'global expansion'],
    titleTemplate: (co) => `Regional Expansion Signal for ${co}`
  },
  {
    type: 'local_expansion',
    keywords: ['local', 'city', 'metro', 'neighborhood', 'community', 'district'],
    titleTemplate: (co) => `Local Expansion Signal for ${co}`
  },
  {
    type: 'marketing_campaign',
    keywords: ['campaign', 'brand campaign', 'outdoor', 'digital media', 'ad', 'marketing strategy', 'promo', 'billboard'],
    titleTemplate: (co) => `Marketing Campaign Signal for ${co}`
  },
  {
    type: 'youth_campus_campaign',
    keywords: ['youth', 'campus', 'student', 'gen-z', 'university', 'college tour', 'back to school'],
    titleTemplate: (co) => `Youth & Campus Campaign Signal for ${co}`
  },
  {
    type: 'sponsorship_announcement',
    keywords: ['sponsorship', 'sponsor', 'partner', 'partnership', 'official partner', 'deal', 'renews partnership'],
    titleTemplate: (co) => `Sponsorship Announcement Signal for ${co}`
  },
  {
    type: 'event_sponsorship',
    keywords: ['event sponsorship', 'festival', 'concert', 'marathon', 'tournament', 'esports', 'expo', 'championship'],
    titleTemplate: (co) => `Event Sponsorship Signal for ${co}`
  },
  {
    type: 'marketing_hiring',
    keywords: ['hiring', 'field marketing', 'recruiting', 'manager', 'street team', 'director of marketing', 'marketing lead'],
    titleTemplate: (co) => `Marketing Hiring Signal for ${co}`
  },
  {
    type: 'new_location',
    keywords: ['new location', 'new branch', 'new office', 'site', 'opened in', 'headquarters'],
    titleTemplate: (co) => `New Location Signal for ${co}`
  },
  {
    type: 'influencer_campaign',
    keywords: ['influencer', 'creator', 'ambassador', 'tiktok', 'instagram', 'influencers', 'nil', 'brand ambassador'],
    titleTemplate: (co) => `Influencer Campaign Signal for ${co}`
  },
  {
    type: 'college_event_activity',
    keywords: ['college event', 'mascot', 'collegiate', 'campus activation', 'student challenge'],
    titleTemplate: (co) => `College/Event Activity Signal for ${co}`
  }
];

export class SignalDetector {
  detectSignals(companyName: string, evidence: Evidence[]): Signal[] {
    // HONESTY RULE: If no evidence exists, return 0 signals
    if (!evidence || evidence.length === 0) {
      return [];
    }

    const signals: Signal[] = [];
    const now = new Date().toISOString();

    for (const pattern of SIGNAL_PATTERNS) {
      const matchingEvidence = evidence.filter(ev =>
        pattern.keywords.some(kw =>
          ev.fact.toLowerCase().includes(kw) ||
          ev.claim.toLowerCase().includes(kw) ||
          ev.source.title.toLowerCase().includes(kw)
        )
      );

      if (matchingEvidence.length > 0) {
        const evidenceIds = matchingEvidence.map(e => e.id);
        const firstEv = matchingEvidence[0];

        signals.push({
          id: `sig_${crypto.randomBytes(6).toString('hex')}`,
          type: pattern.type,
          title: pattern.titleTemplate(companyName),
          summary: `Detected ${pattern.type.replace(/_/g, ' ')} backed by verified source "${firstEv.source.title}". Fact: "${firstEv.fact}"`,
          evidenceIds,
          sourceUrl: firstEv.source.url,
          sourceTitle: firstEv.source.title,
          detectedAt: now
        });
      }
    }

    // Default general growth signal only if evidence exists but no specific signal pattern matched
    if (signals.length === 0 && evidence.length > 0) {
      const firstEv = evidence[0];
      signals.push({
        id: `sig_${crypto.randomBytes(6).toString('hex')}`,
        type: 'general_growth',
        title: `${companyName} Active Market Presence`,
        summary: `Detected commercial growth and market presence backed by verified evidence: "${firstEv.fact}"`,
        evidenceIds: evidence.map(e => e.id),
        sourceUrl: firstEv.source.url,
        sourceTitle: firstEv.source.title,
        detectedAt: now
      });
    }

    return signals;
  }
}
