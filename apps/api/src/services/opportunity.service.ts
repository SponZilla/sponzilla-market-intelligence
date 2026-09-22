import { AIAnalysisResult, AIAnalyzer } from './ai.service';
import { EvidenceExtractor } from './evidence.service';
import { CompanyInput, Opportunity, ResearchRun, Source } from '@sponzilla/shared';
import { SignalDetector } from './signal.service';
import { SourceProvider } from './source.provider';
import crypto from 'crypto';

export class OpportunityService {
  private sourceProvider = new SourceProvider();
  private evidenceExtractor = new EvidenceExtractor();
  private signalDetector = new SignalDetector();
  private aiAnalyzer = new AIAnalyzer();

  // In-memory store for MVP persistence
  private researchRunsStore = new Map<string, ResearchRun>();
  private opportunitiesStore = new Map<string, Opportunity>();

  async executeResearchPipeline(input: CompanyInput): Promise<ResearchRun> {
    const runId = `run_${crypto.randomBytes(8).toString('hex')}`;
    const now = new Date().toISOString();

    const initialRun: ResearchRun = {
      id: runId,
      companyInput: input,
      status: 'IN_PROGRESS',
      sources: [],
      evidence: [],
      signals: [],
      opportunity: null,
      error: null,
      createdAt: now,
      completedAt: null
    };

    this.researchRunsStore.set(runId, initialRun);

    try {
      // 1. Live Research & Source Retrieval (Reachable 200 OK links only)
      const sources: Source[] = await this.sourceProvider.fetchSources(input);

      // 2. Evidence Extraction (Real facts bound to verified source URLs)
      const evidence = this.evidenceExtractor.extractEvidence(sources, input.companyName);

      // 3. Signal Detection
      const signals = this.signalDetector.detectSignals(input.companyName, evidence);

      // 4. Grounded AI Analysis
      const aiAnalysis: AIAnalysisResult = await this.aiAnalyzer.analyze(input, evidence, signals);

      // 5. Build Opportunity Object
      const oppId = `opp_${crypto.randomBytes(8).toString('hex')}`;
      const opportunity: Opportunity = {
        id: oppId,
        company: {
          name: input.companyName,
          websiteUrl: input.websiteUrl,
          location: input.location || null,
          category: input.category || null
        },
        signals,
        evidence,
        audience: aiAnalysis.audience,
        marketingNeed: aiAnalysis.marketingNeed,
        aiInference: aiAnalysis.aiInference,
        confidence: aiAnalysis.confidence,
        confidenceReason: aiAnalysis.confidenceReason,
        recommendation: aiAnalysis.recommendation,
        status: aiAnalysis.status,
        nextAction: aiAnalysis.nextAction,
        outcome: null,
        createdAt: now
      };

      const completedRun: ResearchRun = {
        ...initialRun,
        status: 'COMPLETED',
        sources,
        evidence,
        signals,
        opportunity,
        completedAt: new Date().toISOString()
      };

      this.researchRunsStore.set(runId, completedRun);
      this.opportunitiesStore.set(oppId, opportunity);

      return completedRun;
    } catch (err: any) {
      const failedRun: ResearchRun = {
        ...initialRun,
        status: 'FAILED',
        error: err?.message || 'Research pipeline execution failure',
        completedAt: new Date().toISOString()
      };
      this.researchRunsStore.set(runId, failedRun);
      return failedRun;
    }
  }

  getResearchRun(runId: string): ResearchRun | undefined {
    return this.researchRunsStore.get(runId);
  }

  getOpportunity(oppId: string): Opportunity | undefined {
    return this.opportunitiesStore.get(oppId);
  }

  getAllOpportunities(): Opportunity[] {
    return Array.from(this.opportunitiesStore.values());
  }
}
