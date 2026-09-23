import React, { useState, useEffect } from 'react';
import { ResearchRun, Opportunity, CompanyInput } from '@sponzilla/shared';
import { 
  Zap, 
  Search, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  ArrowRight, 
  FileCode,
  Sparkles,
  TrendingUp,
  Building2,
  Globe,
  Lock,
  Layers,
  FileText,
  BrainCircuit,
  Target
} from 'lucide-react';

const PRESET_COMPANIES: CompanyInput[] = [
  { companyName: 'Red Bull', websiteUrl: 'https://redbull.com', location: 'New York, NY', category: 'Energy Drinks / Esports' },
  { companyName: 'Nike', websiteUrl: 'https://nike.com', location: 'Beaverton, OR', category: 'Athletics & Apparel' },
  { companyName: 'Duolingo', websiteUrl: 'https://duolingo.com', location: 'Pittsburgh, PA', category: 'EdTech / Education' },
  { companyName: 'Gymshark', websiteUrl: 'https://gymshark.com', location: 'New York, NY', category: 'Fitness & Retail' },
  { companyName: 'Liquid Death', websiteUrl: 'https://liquiddeath.com', location: 'Los Angeles, CA', category: 'Beverage & Lifestyle' }
];

export default function App() {
  const [formData, setFormData] = useState<CompanyInput>({
    companyName: 'Red Bull',
    websiteUrl: 'https://redbull.com',
    location: 'New York, NY',
    category: 'Energy Drinks / Esports'
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [currentRun, setCurrentRun] = useState<ResearchRun | null>(null);
  const [activeTab, setActiveTab] = useState<'opportunity' | 'evidence' | 'json'>('opportunity');
  const [history, setHistory] = useState<ResearchRun[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Automatically trigger initial research run on load
  useEffect(() => {
    handleResearchSubmit(PRESET_COMPANIES[0]);
  }, []);

  const handlePresetSelect = (preset: CompanyInput) => {
    setFormData(preset);
    handleResearchSubmit(preset);
  };

  const handleResearchSubmit = async (inputToRun?: CompanyInput) => {
    const rawPayload = inputToRun || formData;
    let websiteUrl = rawPayload.websiteUrl.trim();
    if (websiteUrl && !websiteUrl.startsWith('http://') && !websiteUrl.startsWith('https://')) {
      websiteUrl = `https://${websiteUrl}`;
    }

    const payload = {
      ...rawPayload,
      websiteUrl
    };

    setLoading(true);
    setErrorMessage(null);

    try {
      let res = await fetch('/api/v1/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        try {
          const directRes = await fetch('http://127.0.0.1:3001/api/v1/research', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          if (directRes.ok) {
            res = directRes;
          }
        } catch {}
      }

      if (!res.ok) {
        const errText = await res.text();
        let parsedMessage = `API Error ${res.status}: ${res.statusText}`;
        try {
          const parsed = JSON.parse(errText);
          if (parsed.details && Array.isArray(parsed.details)) {
            parsedMessage = parsed.details.map((d: any) => d.message).join(', ');
          } else if (parsed.message) {
            parsedMessage = parsed.message;
          }
        } catch {}
        setErrorMessage(parsedMessage);
        return;
      }

      const data: ResearchRun = await res.json();
      setCurrentRun(data);
      if (data.status === 'COMPLETED') {
        setHistory(prev => [data, ...prev.filter(h => h.id !== data.id)]);
      }
    } catch (err: any) {
      console.error('Failed to execute research pipeline:', err);
      setErrorMessage(err?.message || 'Failed to connect to backend research server.');
    } finally {
      setLoading(false);
    }
  };

  const opp: Opportunity | null = currentRun?.opportunity || null;
  const isNoOpportunity = opp?.qualificationStatus === 'NO_VERIFIED_OPPORTUNITY';

  return (
    <div className="container">
      {/* Brand Header */}
      <header className="header">
        <div className="brand">
          <div className="brand-icon">
            <Zap style={{ color: '#fff', width: 24, height: 24 }} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <h1 className="brand-title">SPONZILLA</h1>
              <span className="brand-tag">VERIFIED SOURCE → FACT → INFERENCE → OPPORTUNITY</span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 2 }}>
              Strict Fact vs AI Inference Grounding Pipeline (0 Dummy URLs)
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ fontSize: '0.8rem', color: '#4ade80', display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(34, 197, 94, 0.1)', padding: '0.4rem 0.8rem', borderRadius: 8, border: '1px solid rgba(34, 197, 94, 0.3)' }}>
            <Globe style={{ width: 14, height: 14 }} />
            Live Web Crawl Active
          </div>
        </div>
      </header>

      {/* Main Grid Layout */}
      <div className="grid-layout">
        {/* Left Column: Input Form & Quick Presets */}
        <div>
          <div className="glass-panel">
            <h2 className="panel-title">
              <Search style={{ width: 18, height: 18, color: 'var(--primary)' }} />
              Target Company Research
            </h2>

            <div className="preset-label">Test Real Companies</div>
            <div className="preset-buttons">
              {PRESET_COMPANIES.map(p => (
                <button
                  key={p.companyName}
                  className="btn-preset"
                  onClick={() => handlePresetSelect(p)}
                >
                  {p.companyName}
                </button>
              ))}
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleResearchSubmit(); }}>
              <div className="form-group">
                <label className="form-label">Company Name *</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.companyName}
                  onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                  placeholder="e.g. Red Bull"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Website URL *</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.websiteUrl}
                  onChange={e => setFormData({ ...formData, websiteUrl: e.target.value })}
                  placeholder="https://example.com"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Target Location (Optional)</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.location || ''}
                  onChange={e => setFormData({ ...formData, location: e.target.value || null })}
                  placeholder="e.g. New York, NY"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Industry / Category (Optional)</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.category || ''}
                  onChange={e => setFormData({ ...formData, category: e.target.value || null })}
                  placeholder="e.g. Energy Drinks / Esports"
                />
              </div>

              <button
                type="submit"
                className="btn-primary"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="spinner"></div>
                    Crawling & Verifying Live URLs...
                  </>
                ) : (
                  <>
                    <Sparkles style={{ width: 18, height: 18 }} />
                    Run Real Web Research
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Evaluation History Panel */}
          {history.length > 0 && (
            <div className="glass-panel" style={{ marginTop: '1.5rem' }}>
              <h3 className="panel-title" style={{ fontSize: '0.95rem' }}>
                <Building2 style={{ width: 16, height: 16, color: '#a5b4fc' }} />
                Recent Research Runs
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {history.map(h => (
                  <div
                    key={h.id}
                    onClick={() => setCurrentRun(h)}
                    style={{
                      padding: '0.6rem 0.8rem',
                      borderRadius: 8,
                      background: currentRun?.id === h.id ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                      border: currentRun?.id === h.id ? '1px solid var(--primary)' : '1px solid transparent',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{h.companyInput.companyName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {h.evidence.length} Facts • {h.sources.length} Verified URLs
                      </div>
                    </div>
                    {h.opportunity && (
                      <span className={`badge-confidence ${h.opportunity.confidence}`}>
                        {h.opportunity.confidence}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Output Viewer with Navigation Tabs */}
        <div>
          {errorMessage && (
            <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#fca5a5', padding: '1rem', borderRadius: 12, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <AlertCircle style={{ width: 20, height: 20, flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Research Execution Error</div>
                <div style={{ fontSize: '0.85rem' }}>{errorMessage}</div>
              </div>
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="tabs">
            <button
              className={`tab-btn ${activeTab === 'opportunity' ? 'active' : ''}`}
              onClick={() => setActiveTab('opportunity')}
            >
              <TrendingUp style={{ width: 16, height: 16, display: 'inline', marginRight: 6, verticalAlign: 'text-bottom' }} />
              Evidence & Opportunity Pipeline
            </button>
            <button
              className={`tab-btn ${activeTab === 'evidence' ? 'active' : ''}`}
              onClick={() => setActiveTab('evidence')}
            >
              <ShieldCheck style={{ width: 16, height: 16, display: 'inline', marginRight: 6, verticalAlign: 'text-bottom' }} />
              Verified Live Sources ({currentRun?.sources.length || 0})
            </button>
            <button
              className={`tab-btn ${activeTab === 'json' ? 'active' : ''}`}
              onClick={() => setActiveTab('json')}
            >
              <FileCode style={{ width: 16, height: 16, display: 'inline', marginRight: 6, verticalAlign: 'text-bottom' }} />
              Structured JSON Contract
            </button>
          </div>

          {/* TAB 1: EVIDENCE & OPPORTUNITY PIPELINE */}
          {activeTab === 'opportunity' && (
            <div>
              {loading ? (
                <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                  <div className="spinner" style={{ width: 36, height: 36, margin: '0 auto 1.5rem', borderWidth: 3 }}></div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.5rem' }}>Executing Real Web Research...</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    Crawling company pages → Verifying HTTP 200 URLs → Building Fact vs AI Inference Chain
                  </p>
                </div>
              ) : opp ? (
                <div className="glass-panel">
                  {/* Top Bar */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
                    <div>
                      <h2 style={{ fontSize: '1.75rem', fontWeight: 800, background: 'linear-gradient(135deg, #fff, #c7d2fe)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        {opp.company.name}
                      </h2>
                      <a href={opp.company.websiteUrl} target="_blank" rel="noreferrer" style={{ fontSize: '0.85rem', color: '#a5b4fc', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', marginTop: 4 }}>
                        {opp.company.websiteUrl} <ExternalLink style={{ width: 12, height: 12 }} />
                      </a>
                    </div>
                    <div>
                      <span className={`badge-confidence ${opp.confidence}`}>
                        <CheckCircle2 style={{ width: 14, height: 14 }} />
                        {opp.confidence} CONFIDENCE
                      </span>
                    </div>
                  </div>

                  {/* NO VERIFIED OPPORTUNITY BANNER */}
                  {isNoOpportunity ? (
                    <div style={{ background: 'rgba(234, 179, 8, 0.1)', border: '1px solid rgba(234, 179, 8, 0.3)', borderRadius: 12, padding: '1.5rem', marginBottom: '1.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#facc15', fontWeight: 700, fontSize: '1rem', marginBottom: '0.5rem' }}>
                        <Lock style={{ width: 18, height: 18 }} />
                        Status: NO_VERIFIED_OPPORTUNITY
                      </div>
                      <p style={{ color: '#fef08a', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '0.75rem' }}>
                        {opp.aiInference.summary}
                      </p>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                        <strong>Reason: </strong> {opp.confidenceReason}
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* PIPELINE CARDS: VERIFIED SOURCE -> FACT -> AI INFERENCE -> OPPORTUNITY */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}>
                        <div className="preset-label" style={{ fontSize: '0.85rem', color: '#a5b4fc' }}>
                          Evidence Chains (Verified Source → Fact → AI Inference → Opportunity)
                        </div>

                        {opp.evidence.map((ev, idx) => {
                          const matchingSignal = opp.signals[idx % opp.signals.length];
                          return (
                            <div 
                              key={ev.id} 
                              style={{ 
                                background: 'rgba(15, 23, 42, 0.7)', 
                                border: '1px solid var(--border-color)', 
                                borderRadius: 14, 
                                padding: '1.25rem',
                                boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
                              }}
                            >
                              {/* 1. SIGNAL TITLE */}
                              {matchingSignal && (
                                <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <div className="signal-badge" style={{ fontSize: '0.8rem', padding: '0.3rem 0.65rem' }}>
                                    ⚡ SIGNAL: {matchingSignal.type.replace('_', ' ').toUpperCase()} — {matchingSignal.title}
                                  </div>
                                </div>
                              )}

                              {/* 2. VERIFIED EVIDENCE CARD */}
                              <div style={{ background: 'rgba(34, 197, 94, 0.06)', border: '1px solid rgba(34, 197, 94, 0.25)', borderRadius: 10, padding: '1rem', marginBottom: '1rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#4ade80', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                    <ShieldCheck style={{ width: 14, height: 14 }} /> Verified Evidence Record
                                  </div>
                                  <span style={{ fontSize: '0.7rem', background: 'rgba(34, 197, 94, 0.2)', color: '#4ade80', padding: '0.15rem 0.5rem', borderRadius: 6, fontWeight: 700 }}>
                                    VERIFIED 200 OK
                                  </span>
                                </div>

                                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fff', marginBottom: '0.4rem' }}>
                                  Claim: "{ev.claim}"
                                </div>

                                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.5rem' }}>
                                  <div><strong>Source Title:</strong> {ev.source.title}</div>
                                  <div><strong>Source Type:</strong> {ev.source.type}</div>
                                  <div><strong>Published Date:</strong> {ev.source.publishedAt || 'Recent'}</div>
                                  <div>
                                    <strong>Source URL: </strong> 
                                    <a href={ev.source.url} target="_blank" rel="noreferrer" style={{ color: '#60a5fa', textDecoration: 'none', wordBreak: 'break-all' }}>
                                      {ev.source.url} <ExternalLink style={{ width: 11, height: 11, display: 'inline' }} />
                                    </a>
                                  </div>
                                </div>
                              </div>

                              {/* 3. FACT BLOCK */}
                              <div style={{ background: 'rgba(255, 255, 255, 0.03)', borderLeft: '3px solid #6366f1', padding: '0.85rem 1rem', borderRadius: '0 8px 8px 0', marginBottom: '1rem' }}>
                                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#a5b4fc', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.25rem' }}>
                                  <FileText style={{ width: 13, height: 13 }} /> Confirmed Fact
                                </div>
                                <blockquote style={{ fontSize: '0.88rem', color: '#f1f5f9', fontStyle: 'italic', lineHeight: 1.5 }}>
                                  {ev.fact}
                                </blockquote>
                              </div>

                              {/* 4. AI INFERENCE BLOCK */}
                              <div style={{ background: 'rgba(139, 92, 246, 0.08)', borderLeft: '3px solid #8b5cf6', padding: '0.85rem 1rem', borderRadius: '0 8px 8px 0', marginBottom: '1rem' }}>
                                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#c084fc', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.25rem' }}>
                                  <BrainCircuit style={{ width: 13, height: 13 }} /> Cautious AI Inference
                                </div>
                                <div style={{ fontSize: '0.88rem', color: '#e2e8f0', lineHeight: 1.5 }}>
                                  {ev.aiInference}
                                </div>
                              </div>

                              {/* 5. RESULTING OPPORTUNITY BLOCK */}
                              <div style={{ background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.1), rgba(99, 102, 241, 0.1))', border: '1px solid rgba(236, 72, 153, 0.3)', borderRadius: 10, padding: '0.85rem 1rem' }}>
                                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f472b6', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.25rem' }}>
                                  <Target style={{ width: 13, height: 13 }} /> Resulting Commercial Opportunity
                                </div>
                                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff' }}>
                                  {ev.suggestedAngle}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Strategic Summary & Next Action */}
                      <div style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(139, 92, 246, 0.15))', border: '1px solid rgba(99, 102, 241, 0.3)', borderRadius: 12, padding: '1.25rem' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#a5b4fc', textTransform: 'uppercase', marginBottom: '0.3rem' }}>Overall Recommendation</div>
                        <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', marginBottom: '0.75rem' }}>
                          {opp.recommendation}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(0, 0, 0, 0.3)', padding: '0.75rem 1rem', borderRadius: 8, border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                          <ArrowRight style={{ width: 18, height: 18, color: 'var(--accent)' }} />
                          <div style={{ fontSize: '0.85rem', color: '#f1f5f9' }}>
                            <span style={{ fontWeight: 700, color: 'var(--accent)' }}>Next GTM Action: </span>
                            {opp.nextActionHint}
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem' }}>
                  <AlertCircle style={{ width: 32, height: 32, color: 'var(--text-muted)', margin: '0 auto 1rem' }} />
                  <p style={{ color: 'var(--text-secondary)' }}>No research run loaded. Select a company or run the pipeline.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: FACTS & VERIFIED SOURCES */}
          {activeTab === 'evidence' && (
            <div className="glass-panel">
              <h2 className="panel-title">
                <ShieldCheck style={{ width: 20, height: 20, color: '#4ade80' }} />
                Real Discovered Sources & Fact Verification (0 Dummy URLs)
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                Every single URL listed below was discovered live and verified via HTTP 200 reachability check.
              </p>

              {currentRun?.sources.map(src => (
                <div key={src.id} className="evidence-item" style={{ borderLeftColor: '#4ade80' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <div className="evidence-title" style={{ color: '#4ade80' }}>
                      <CheckCircle2 style={{ width: 14, height: 14 }} />
                      {src.title}
                    </div>
                    <span style={{ fontSize: '0.7rem', background: 'rgba(34, 197, 94, 0.15)', color: '#4ade80', padding: '0.15rem 0.5rem', borderRadius: 6, fontWeight: 700 }}>
                      VERIFIED 200 OK
                    </span>
                  </div>
                  <div className="evidence-fact">
                    "{src.snippet}"
                  </div>
                  <a href={src.url} target="_blank" rel="noreferrer" className="evidence-link" style={{ color: '#60a5fa' }}>
                    Click to Open Source: {src.url} <ExternalLink style={{ width: 12, height: 12 }} />
                  </a>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: STRUCTURED JSON CONTRACT */}
          {activeTab === 'json' && (
            <div className="glass-panel">
              <h2 className="panel-title">
                <FileCode style={{ width: 20, height: 20, color: 'var(--primary)' }} />
                Machine-Readable Opportunity JSON
              </h2>
              <pre className="json-viewer">
                {JSON.stringify(currentRun, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
