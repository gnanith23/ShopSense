import { useState } from 'react';
import { Bot, Sparkles, Send, Terminal, Table, Check, Copy, AlertCircle, ArrowRight } from 'lucide-react';
import api from '../api/api';

const EXAMPLE_QUESTIONS = [
  'Which product generated the most revenue?',
  'What category sold the most units?',
  'Show my daily sales breakdown',
  'What is my overall total revenue and average order value?',
];

export default function AiDataAnalystWidget() {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  async function handleAnalyze(queryToRun) {
    const q = queryToRun || question;
    if (!q || !q.trim()) return;

    setLoading(true);
    setError('');
    setAnalysis(null);

    try {
      const res = await api.post('/analytics/ai-analyst', { question: q.trim() });
      setAnalysis(res.data);
      if (queryToRun) setQuestion(queryToRun);
    } catch (err) {
      console.error('AI Data Analyst failed:', err);
      setError(err.response?.data?.message || err.message || 'Failed to process question.');
    } finally {
      setLoading(false);
    }
  }

  function handleCopySQL() {
    if (analysis?.query) {
      navigator.clipboard.writeText(analysis.query);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="card" style={{ marginBottom: '1.5rem' }}>
      <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8, background: '#FAF5FF',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9333EA'
          }}>
            <Bot size={18} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#0F172A' }}>
              AI Data Analyst (Text-to-SQL)
            </h3>
            <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748B' }}>
              Ask natural language business questions answered via safe, vendor-scoped SQL analytics
            </p>
          </div>
        </div>

        <span style={{
          fontSize: '0.6875rem', fontWeight: 700, padding: '3px 8px', borderRadius: 6,
          background: '#FAF5FF', color: '#7E22CE', border: '1px solid #E9D5FF'
        }}>
          Safe Read-Only SQL Engine
        </span>
      </div>

      <div className="card-body">
        {/* Suggestion Chips */}
        <div style={{ marginBottom: '0.75rem' }}>
          <div style={{ fontSize: '0.6875rem', color: '#64748B', fontWeight: 600, marginBottom: '0.35rem' }}>
            Quick Questions:
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
            {EXAMPLE_QUESTIONS.map((ex) => (
              <button
                key={ex}
                onClick={() => handleAnalyze(ex)}
                disabled={loading}
                style={{
                  background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 999,
                  padding: '3px 10px', fontSize: '0.6875rem', color: '#475569', cursor: 'pointer',
                  display: 'inline-flex', alignItems: 'center', gap: 4, transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#9333EA'; e.currentTarget.style.color = '#7E22CE'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.color = '#475569'; }}
              >
                <Sparkles size={11} color="#9333EA" />
                {ex}
              </button>
            ))}
          </div>
        </div>

        {/* Input bar */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          <input
            type="text"
            className="form-input"
            placeholder="Ask anything about your sales data (e.g. What is my best performing category?)..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
            disabled={loading}
            style={{ flex: 1, fontSize: '0.8125rem' }}
          />
          <button
            onClick={() => handleAnalyze()}
            disabled={loading || !question.trim()}
            style={{
              padding: '0 1rem', background: '#9333EA', color: 'white',
              border: 'none', borderRadius: 8, fontSize: '0.8125rem', fontWeight: 600,
              display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
              cursor: loading || !question.trim() ? 'not-allowed' : 'pointer',
              opacity: loading || !question.trim() ? 0.7 : 1
            }}
          >
            {loading ? <Bot size={16} className="animate-spin" /> : <Send size={16} />}
            {loading ? 'Analyzing...' : 'Ask Analyst'}
          </button>
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {/* Analysis Results Display */}
        {analysis && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* 1. AI Analytical Summary */}
            <div style={{
              padding: '1rem', background: 'linear-gradient(135deg, #FAF5FF 0%, #F5F3FF 100%)',
              borderRadius: 8, border: '1px solid #E9D5FF'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                <Sparkles size={15} color="#7E22CE" />
                <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#6B21A8' }}>
                  Analyst Insight
                </span>
              </div>
              <div style={{ fontSize: '0.8125rem', color: '#4C1D95', lineHeight: 1.5, whiteSpace: 'pre-line' }}>
                {analysis.explanation}
              </div>
            </div>

            {/* 2. Generated SQL Query */}
            <div style={{
              background: '#0F172A', borderRadius: 8, padding: '0.875rem 1rem',
              color: '#E2E8F0', fontSize: '0.75rem', fontFamily: 'monospace'
            }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginBottom: '0.5rem', borderBottom: '1px solid #334155', paddingBottom: '0.35rem'
              }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#94A3B8', fontWeight: 600 }}>
                  <Terminal size={12} /> Generated Safe SQL Query
                </span>
                <button
                  onClick={handleCopySQL}
                  style={{
                    background: 'transparent', border: 'none', color: '#94A3B8',
                    cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: '0.6875rem'
                  }}
                >
                  {copied ? <Check size={12} color="#10B981" /> : <Copy size={12} />}
                  {copied ? 'Copied' : 'Copy SQL'}
                </button>
              </div>
              <code style={{ color: '#38BDF8', wordBreak: 'break-all' }}>
                {analysis.query}
              </code>
            </div>

            {/* 3. Query Results Table */}
            {analysis.results && analysis.results.length > 0 && (
              <div style={{ overflowX: 'auto', background: '#FFFFFF', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                <div style={{
                  padding: '8px 12px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0',
                  fontSize: '0.75rem', fontWeight: 600, color: '#475569', display: 'flex', alignItems: 'center', gap: 4
                }}>
                  <Table size={13} /> Executed Data Results ({analysis.results.length} rows)
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #E2E8F0', color: '#64748B', textAlign: 'left', background: '#F8FAFC' }}>
                      {Object.keys(analysis.results[0]).map((col) => (
                        <th key={col} style={{ padding: '8px 12px', fontWeight: 600 }}>
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {analysis.results.map((row, rIdx) => (
                      <tr key={rIdx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        {Object.values(row).map((val, cIdx) => (
                          <td key={cIdx} style={{ padding: '8px 12px', color: '#1E293B' }}>
                            {typeof val === 'number' && val % 1 !== 0 ? val.toFixed(2) : String(val ?? '')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
