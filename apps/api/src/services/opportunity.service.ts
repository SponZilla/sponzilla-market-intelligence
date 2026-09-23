import { AIAnalysisResult, AIAnalyzer } from './ai.service';
import { EvidenceExtractor } from './evidence.service';
import {
  CompanyInput,
  OpportunityV1,
  ResearchRun,
  Source,
} from '@sponzilla/shared';
import { SignalDetector } from './signal.service';
import { SourceProvider } from './source.provider';
import { buildOpportunityV1 } from './opportunity.mapper';
import crypto from 'crypto';

export class OpportunityService {
  private sourceProvider = new SourceProvider();
  private evidenceExtractor = new EvidenceExtractor();
  private signalDetector = new SignalDetector();
  private aiAnalyzer = new AIAnalyzer();

  // In-memory store for MVP persistence
  private researchRunsStore = new Map<string, ResearchRun>();
  private opportunitiesStore = new Map<string, OpportunityV1>();

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
      completedAt: null,
    };

    this.researchRunsStore.set(runId, initialRun);

    try {
      const sources: Source[] = await this.sourceProvider.fetchSources(input);
      const evidence = this.evidenceExtractor.extractEvidence(
        sources,
        input.companyName,
      );
      const signals = this.signalDetector.detectSignals(
        input.companyName,
        evidence,
      );
      const aiAnalysis: AIAnalysisResult = await this.aiAnalyzer.analyze(
        input,
        evidence,
        signals,
      );

      const oppId = `opp_${crypto.randomBytes(8).toString('hex')}`;
      const opportunity = buildOpportunityV1({
        id: oppId,
        companyInput: input,
        evidence,
        signals,
        audience: aiAnalysis.audience,
        marketingNeed: aiAnalysis.marketingNeed,
        aiInference: aiAnalysis.aiInference,
        confidence: aiAnalysis.confidence,
        confidenceReason: aiAnalysis.confidenceReason,
        recommendation: aiAnalysis.recommendation,
        nextActionHint: aiAnalysis.nextAction,
        aiStatus: aiAnalysis.status,
        producedAt: now,
      });

      const completedRun: ResearchRun = {
        ...initialRun,
        status: 'COMPLETED',
        sources,
        evidence,
        signals,
        opportunity,
        completedAt: new Date().toISOString(),
      };

      this.researchRunsStore.set(runId, completedRun);
      this.opportunitiesStore.set(oppId, opportunity);

      return completedRun;
    } catch (err: any) {
      const failedRun: ResearchRun = {
        ...initialRun,
        status: 'FAILED',
        error: err?.message || 'Research pipeline execution failure',
        completedAt: new Date().toISOString(),
      };
      this.researchRunsStore.set(runId, failedRun);
      return failedRun;
    }
  }

  getResearchRun(runId: string): ResearchRun | undefined {
    return this.researchRunsStore.get(runId);
  }

  getOpportunity(oppId: string): OpportunityV1 | undefined {
    return this.opportunitiesStore.get(oppId);
  }

  getAllOpportunities(): OpportunityV1[] {
    return Array.from(this.opportunitiesStore.values());
  }
}
