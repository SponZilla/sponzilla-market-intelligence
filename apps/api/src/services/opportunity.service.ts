import { AIAnalysisResult, AIAnalyzer } from './ai.service';
import { EvidenceExtractor } from './evidence.service';
import { CompanyInput, CompanyInputSchema, Opportunity, OpportunitySchema, ResearchRun, Source } from '@sponzilla/shared';
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

  async executeResearchPipeline(rawInput: CompanyInput): Promise<ResearchRun> {
    const runId = `run_${crypto.randomBytes(8).toString('hex')}`;
    const now = new Date().toISOString();

    // 1. Validate Input against canonical schema
    const input = CompanyInputSchema.parse(rawInput);
    console.log(`\n[OpportunityService] Starting research pipeline (Run ID: ${runId}) for company: "${input.companyName}" (${input.websiteUrl})`);

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
      // 2. Live Research & Source Retrieval
      console.log(`[OpportunityService] [Step 1/5] Fetching and verifying sources...`);
      const sources: Source[] = await this.sourceProvider.fetchSources(input);
      console.log(`[OpportunityService] Discovered & verified ${sources.length} live HTTP 200 sources.`);

      // 3. Evidence Extraction (Real facts bound to verified source URLs)
      console.log(`[OpportunityService] [Step 2/5] Extracting verified evidence items...`);
      const evidence = this.evidenceExtractor.extractEvidence(sources, input.companyName);
      console.log(`[OpportunityService] Extracted ${evidence.length} evidence facts.`);

      // 4. Signal Detection
      console.log(`[OpportunityService] [Step 3/5] Detecting signals...`);
      const signals = this.signalDetector.detectSignals(input.companyName, evidence);
      console.log(`[OpportunityService] Detected ${signals.length} signals: ${signals.map(s => s.type).join(', ')}`);

      // 5. Grounded AI Analysis
      console.log(`[OpportunityService] [Step 4/5] Executing AI analysis...`);
      const aiAnalysis: AIAnalysisResult = await this.aiAnalyzer.analyze(input, evidence, signals);

      // 6. Build Opportunity Object
      const oppId = `opp_${crypto.randomBytes(8).toString('hex')}`;
      const unvalidatedOpportunity: Opportunity = {
        id: oppId,
        company: {
          name: input.companyName,
          websiteUrl: input.websiteUrl,
          location: input.location || null,
          category: input.category || null,
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
        createdAt: now,
      };

      // 7. Validate Opportunity Object against Canonical Contract
      console.log(`[OpportunityService] [Step 5/5] Validating OpportunityV1 contract schema...`);
      const opportunity: Opportunity = OpportunitySchema.parse(unvalidatedOpportunity);
      console.log(`[OpportunityService] OpportunityV1 successfully validated! (Status: ${opportunity.status}, Confidence: ${opportunity.confidence})`);

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
      console.error(`[OpportunityService] Pipeline execution error:`, err?.message || err);
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

  getOpportunity(oppId: string): Opportunity | undefined {
    return this.opportunitiesStore.get(oppId);
  }

  getAllOpportunities(): Opportunity[] {
    return Array.from(this.opportunitiesStore.values());
  }
}
