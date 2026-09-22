import { OpportunityService } from '../apps/api/src/services/opportunity.service';

const TEST_COMPANIES = [
  { companyName: 'Red Bull', websiteUrl: 'https://redbull.com', location: 'New York, NY', category: 'Energy Drinks / Esports' },
  { companyName: 'Nike', websiteUrl: 'https://nike.com', location: 'Beaverton, OR', category: 'Athletics & Apparel' },
  { companyName: 'Duolingo', websiteUrl: 'https://duolingo.com', location: 'Pittsburgh, PA', category: 'EdTech / Education' },
  { companyName: 'Gymshark', websiteUrl: 'https://gymshark.com', location: 'New York, NY', category: 'Fitness & Retail' },
  { companyName: 'Liquid Death', websiteUrl: 'https://liquiddeath.com', location: 'Los Angeles, CA', category: 'Beverage & Lifestyle' },
  // EDGE CASE: Offline / Non-Existent Domain
  { companyName: 'NonExistent Corp', websiteUrl: 'https://nonexistent-fake-domain-999.com', location: 'Unknown', category: 'Fake Tech' }
];

async function runSeed() {
  console.log('🚀 Starting SponZilla REAL Web Research Evaluation Suite (6 Test Runs including Edge Cases)...');
  console.log('------------------------------------------------------------');

  const service = new OpportunityService();

  for (const comp of TEST_COMPANIES) {
    console.log(`\n🔍 Live Crawling & Web Researching: ${comp.companyName} (${comp.websiteUrl})...`);
    const run = await service.executeResearchPipeline(comp);

    if (run.status === 'COMPLETED' && run.opportunity) {
      console.log(`✅ Success | Run ID: ${run.id}`);
      console.log(`   Status: [${run.opportunity.status}]`);
      console.log(`   Verified Live URLs Captured: ${run.sources.length}`);
      run.sources.forEach((s, idx) => {
        console.log(`     [Source ${idx + 1}] (${s.verificationStatus}) ${s.title}`);
        console.log(`                 URL: ${s.url}`);
      });
      console.log(`   Evidence Facts: ${run.evidence.length}`);
      console.log(`   Signals Detected: ${run.signals.map(s => s.type).join(', ')}`);
      console.log(`   Audience: ${run.opportunity.audience}`);
      console.log(`   Confidence: [${run.opportunity.confidence}] - ${run.opportunity.confidenceReason}`);
      console.log(`   Recommendation: ${run.opportunity.recommendation}`);
      console.log(`   Next Action: ${run.opportunity.nextAction}`);
    } else {
      console.log(`❌ Pipeline Error: ${run.error}`);
    }
  }

  console.log('\n------------------------------------------------------------');
  console.log('✨ All 6 test evaluation runs completed!');
}

runSeed().catch(err => {
  console.error('Fatal Seed Error:', err);
  process.exit(1);
});
