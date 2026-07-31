import { useMemo } from 'react';
import { Target } from 'lucide-react';

export default function CatalogQualityScore({ products = [] }) {
  const score = useMemo(() => {
    if (products.length === 0) return 0;
    
    let totalScore = 0;
    
    products.forEach(p => {
      let productScore = 0;
      if (p.description && p.description.split(' ').length > 20) productScore += 20;
      if (p.imageUrl) productScore += 20;
      if (p.aiTags && p.aiTags.length > 0) productScore += 20;
      if (p.seoKeywords && p.seoKeywords.length > 0) productScore += 20;
      if (p.stock > 0) productScore += 20;
      
      totalScore += productScore;
    });
    
    return Math.round(totalScore / products.length);
  }, [products]);

  const color = score >= 80 ? '#10B981' : score >= 50 ? '#F59E0B' : '#EF4444';
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="card-header" style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ background: '#F1F5F9', padding: '0.5rem', borderRadius: 8, color: '#0284C7', display: 'flex' }}>
          <Target size={20} />
        </div>
        <div>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#0F172A' }}>Catalog Quality</h3>
          <p style={{ margin: '2px 0 0', fontSize: '0.8125rem', color: '#64748B' }}>Average health of your products</p>
        </div>
      </div>
      
      <div className="card-body" style={{ padding: '1.5rem', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ position: 'relative', width: 120, height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="120" height="120" style={{ transform: 'rotate(-90deg)' }}>
            <circle
              cx="60" cy="60" r={radius}
              fill="none" stroke="#E2E8F0" strokeWidth="8"
            />
            <circle
              cx="60" cy="60" r={radius}
              fill="none" stroke={color} strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.5s ease' }}
            />
          </svg>
          <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0F172A', lineHeight: 1 }}>{score}%</span>
          </div>
        </div>
      </div>
      <div style={{ padding: '0 1.5rem 1.5rem', textAlign: 'center' }}>
        <p style={{ margin: 0, fontSize: '0.875rem', color: '#475569' }}>
          {score >= 80 ? 'Excellent work! Your catalog is well optimized.' : score >= 50 ? 'Looking good, but there is room for optimization.' : 'Your catalog needs attention to maximize sales.'}
        </p>
      </div>
    </div>
  );
}
