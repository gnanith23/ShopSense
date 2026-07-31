import { CheckCircle2, AlertCircle, TrendingUp } from 'lucide-react';
import { useMemo } from 'react';

export default function AiseoScoreCard({ productName, category, description, aiTags, seoKeywords }) {
  const { score, checks, suggestions } = useMemo(() => {
    let currentScore = 0;
    const checks = [];
    const suggestions = [];

    // Title Check
    if (productName && productName.length > 5) {
      currentScore += 20;
      checks.push({ label: 'Good Product Title', passed: true });
    } else {
      checks.push({ label: 'Good Product Title', passed: false });
      suggestions.push('Make your product title more descriptive.');
    }

    // Description Length Check
    if (description && description.split(' ').length > 20) {
      currentScore += 20;
      checks.push({ label: 'Description Length', passed: true });
    } else {
      checks.push({ label: 'Description Length', passed: false });
      suggestions.push('Add more details to your product description (aim for > 20 words).');
    }

    // Category Check
    if (category && category.length > 2) {
      currentScore += 20;
      checks.push({ label: 'Category Mentioned', passed: true });
    } else {
      checks.push({ label: 'Category Mentioned', passed: false });
      suggestions.push('Specify a valid category.');
    }

    // AI Tags Check
    if (aiTags && aiTags.length > 0) {
      currentScore += 20;
      checks.push({ label: 'AI Tags Generated', passed: true });
    } else {
      checks.push({ label: 'AI Tags Generated', passed: false });
      suggestions.push('Generate AI Tags for better discovery.');
    }

    // SEO Keywords Check
    if (seoKeywords && seoKeywords.length > 0) {
      currentScore += 20;
      checks.push({ label: 'SEO Keywords Present', passed: true });
    } else {
      checks.push({ label: 'SEO Keywords Present', passed: false });
      suggestions.push('Generate SEO Keywords to rank higher in searches.');
    }

    // Advanced Suggestions based on Title (simple mock rules)
    if (productName && !productName.toLowerCase().includes('wireless') && category?.toLowerCase().includes('electronic')) {
      suggestions.push('Add "Wireless" if applicable to electronics.');
    }
    if (productName && !productName.toLowerCase().includes('battery') && category?.toLowerCase().includes('electronic')) {
      suggestions.push('Mention "Battery" life if applicable.');
    }

    return { score: currentScore, checks, suggestions };
  }, [productName, category, description, aiTags, seoKeywords]);

  // Determine color based on score
  const color = score >= 80 ? '#10B981' : score >= 50 ? '#F59E0B' : '#EF4444';

  return (
    <div className="card" style={{ marginTop: '1.5rem', marginBottom: '1.5rem', border: `1px solid ${color}40` }}>
      <div className="card-header" style={{ borderBottom: '1px solid #E2E8F0', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          background: `${color}15`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: color,
          fontWeight: 700,
          fontSize: '1.125rem'
        }}>
          {score}
        </div>
        <div>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={18} color={color} />
            AI SEO Score
          </h3>
          <p style={{ margin: '2px 0 0', fontSize: '0.8125rem', color: '#64748B' }}>
            Score out of 100 based on title, description, and keywords.
          </p>
        </div>
      </div>

      <div className="card-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', padding: '1.5rem' }}>
        {/* Evaluations */}
        <div>
          <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.875rem', fontWeight: 600, color: '#1E293B' }}>Evaluation</h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {checks.map((check, idx) => (
              <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#475569' }}>
                {check.passed ? (
                  <CheckCircle2 size={16} color="#10B981" style={{ flexShrink: 0 }} />
                ) : (
                  <AlertCircle size={16} color="#EF4444" style={{ flexShrink: 0 }} />
                )}
                <span>{check.label}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Suggestions */}
        <div>
          <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.875rem', fontWeight: 600, color: '#1E293B' }}>Suggestions</h4>
          {suggestions.length > 0 ? (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {suggestions.map((sug, idx) => (
                <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.875rem', color: '#475569' }}>
                  <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#94A3B8', marginTop: 8, flexShrink: 0 }} />
                  <span>{sug}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div style={{ fontSize: '0.875rem', color: '#10B981', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle2 size={16} />
              Great job! Your SEO looks perfect.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
