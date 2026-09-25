import { AIInference, CompanyInput, Evidence, Signal } from '@sponzilla/shared';

export interface AIAnalysisResult {
  audience: string;
  marketingNeed: string;
  aiInference: AIInference;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  confidenceReason: string;
  recommendation: string;
  status: 'NEW' | 'no_verified_opportunity_found';
  nextAction: string;
}

export class AIAnalyzer {
  async analyze(
    input: CompanyInput,
    evidence: Evidence[],
    signals: Signal[]
  ): Promise<AIAnalysisResult> {
    // CRITICAL HONESTY RULE (Requirement 22): If no verified evidence was found, return no_verified_opportunity_found
    if (!evidence || evidence.length === 0) {
      return {
        audience: 'Unknown / Insufficient Data',
        marketingNeed: 'No verified marketing need could be determined from reliable public sources.',
        aiInference: {
          summary: 'No verified GTM opportunity found due to lack of reachable evidence sources.',
          groundedReasoning:
            'No factual claims could be verified from public web research. SponZilla strictly refrains from inventing opportunities or fabricating sources.',
          assumptions: ['No assumptions made because zero factual evidence was verified.'],
          unsupportedClaimsWarning: 'No sufficiently reliable and verifiable source was found.'
        },
        confidence: 'LOW',
        confidenceReason: 'No sufficiently reliable and verifiable public sources reachable.',
        recommendation: 'Do not pursue GTM outreach until verified company signals are published.',
        status: 'no_verified_opportunity_found',
        nextAction: 'Re-run intelligence pipeline when new press releases or public signals are available.'
      };
    }

    // Try OpenAI LLM Integration if API key is configured
    if (process.env.OPENAI_API_KEY) {
      try {
        const llmResult = await this.callOpenAi(input, evidence, signals);
        if (llmResult) return llmResult;
      } catch (err) {
        console.warn('OpenAI API call failed or timed out. Falling back to grounded inference engine:', err);
      }
    }

    // Grounded Deterministic Inference Engine
    const signalTypes = signals.map(s => s.type);
    const hasCampus =
      signalTypes.includes('youth_campus_campaign') ||
      signalTypes.includes('college_event_activity') ||
      signalTypes.includes('sponsorship_announcement') ||
      signalTypes.includes('event_sponsorship');
    const hasHiring = signalTypes.includes('marketing_hiring');
    const hasStore = signalTypes.includes('store_opening') || signalTypes.includes('new_location');

    const confidence: 'HIGH' | 'MEDIUM' | 'LOW' =
      evidence.length >= 3 && signals.length >= 2 ? 'HIGH' : evidence.length >= 1 ? 'MEDIUM' : 'LOW';

    const confidenceReason = `Confidence score calculated from ${evidence.length} verified live HTTP sources and ${signals.length} detected signals.`;

    const targetAudience = hasCampus
      ? 'Gen-Z College Students & Campus Brand Ambassadors (Ages 18-24)'
      : hasStore
      ? 'Urban Consumers & Local Community Members'
      : `${input.companyName} Core Consumer & Active Target Audience`;

    const marketingNeed = hasHiring
      ? `${input.companyName} is expanding field marketing operations based on verified hiring signals.`
      : hasCampus
      ? `${input.companyName} requires turn-key campus event sponsorships to engage student demographics.`
      : `${input.companyName} requires experiential marketing activations to amplify recent commercial growth.`;

    const groundedReasoning = `Inference derived from ${signals.length} verified signals across ${evidence.length} verified sources. Verified URLs: ${evidence.map(e => e.source.url).join(', ')}`;

    const assumptions = [
      `Assumes ${input.companyName}'s marketing budget remains aligned with recent public activity.`,
      `Assumes target audience engagement is highest during current campaign execution windows.`
    ];

    const recommendation = hasCampus
      ? `Pitch SponZilla's Exclusive Campus Sponsorship & Student Ambassador Bundle.`
      : `Initiate GTM partnership outreach with field marketing directors.`;

    const nextAction = `Send tailored GTM proposal deck citing verified signals from ${evidence[0]?.source.title || 'verified sources'}.`;

    return {
      audience: targetAudience,
      marketingNeed,
      aiInference: {
        summary: `Grounded Opportunity: Capitalize on ${input.companyName}'s verified ${signalTypes[0] || 'commercial'} activity.`,
        groundedReasoning,
        assumptions,
        unsupportedClaimsWarning: null
      },
      confidence,
      confidenceReason,
      recommendation,
      status: 'NEW',
      nextAction
    };
  }

  private async callOpenAi(
    input: CompanyInput,
    evidence: Evidence[],
    signals: Signal[]
  ): Promise<AIAnalysisResult | null> {
    const prompt = `
You are SponZilla's GTM Architect. Analyze these VERIFIED FACTS for ${input.companyName}:

VERIFIED EVIDENCE:
${evidence.map((e, i) => `${i + 1}. Claim: "${e.claim}" | Fact: "${e.fact}" (Source: ${e.source.url})`).join('\n')}

DETECTED SIGNALS:
${signals.map(s => `- ${s.type}: ${s.title}`).join('\n')}

INSTRUCTIONS:
- Derive a cautious GTM recommendation grounded ONLY in the evidence provided.
- Do NOT invent facts, contacts, decision makers, or budgets.
- Return valid JSON matching:
{
  "audience": "string",
  "marketingNeed": "string",
  "summary": "string",
  "groundedReasoning": "string",
  "assumptions": ["string"],
  "confidence": "HIGH" | "MEDIUM" | "LOW",
  "confidenceReason": "string",
  "recommendation": "string",
  "nextAction": "string"
}
`;

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a pragmatic B2B GTM analyst. Never invent unverified facts.' },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2
      }),
      signal: AbortSignal.timeout(8000)
    });

    if (!res.ok) return null;
    const json = await res.json();
    const content = JSON.parse(json.choices[0].message.content);

    return {
      audience: content.audience || `${input.companyName} Audience`,
      marketingNeed: content.marketingNeed || `GTM activation for ${input.companyName}`,
      aiInference: {
        summary: content.summary || `Verified activity for ${input.companyName}`,
        groundedReasoning: content.groundedReasoning || 'Grounded in verified public sources.',
        assumptions: content.assumptions || [],
        unsupportedClaimsWarning: null
      },
      confidence: content.confidence === 'HIGH' || content.confidence === 'LOW' ? content.confidence : 'MEDIUM',
      confidenceReason: content.confidenceReason || 'Grounded in verified LLM evidence reasoning.',
      recommendation: content.recommendation || `Initiate outreach for ${input.companyName}`,
      status: 'NEW',
      nextAction: content.nextAction || 'Send proposal'
    };
  }
}
