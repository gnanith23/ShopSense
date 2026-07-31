import { useMemo } from 'react';
import { Sparkles, FileText, Search, Image as ImageIcon, CheckCircle } from 'lucide-react';

export default function AIInsightsWidget({ products = [] }) {
  const stats = useMemo(() => {
    const total = products.length;
    
    let aiGenerated = 0;
    let missingDesc = 0;
    let missingSEO = 0;
    let missingImages = 0;
    let ready = 0;

    products.forEach(p => {
      const hasDesc = p.description && p.description.split(' ').length > 10;
      const hasAI = (p.aiTags && p.aiTags.length > 0) || (p.seoKeywords && p.seoKeywords.length > 0);
      const hasImg = !!p.imageUrl;
      const hasStock = p.stock > 0;

      if (hasAI) aiGenerated++;
      if (!hasDesc) missingDesc++;
      if (!hasAI) missingSEO++;
      if (!hasImg) missingImages++;
      if (hasDesc && hasAI && hasImg && hasStock) ready++;
    });

    return [
      { label: 'Total AI Generated', value: aiGenerated, icon: Sparkles, color: '#8B5CF6', bg: '#F3E8FF' },
      { label: 'Missing Description', value: missingDesc, icon: FileText, color: '#F59E0B', bg: '#FEF3C7' },
      { label: 'Missing SEO', value: missingSEO, icon: Search, color: '#EF4444', bg: '#FEE2E2' },
      { label: 'Missing Images', value: missingImages, icon: ImageIcon, color: '#3B82F6', bg: '#DBEAFE' },
      { label: 'Marketplace Ready', value: ready, icon: CheckCircle, color: '#10B981', bg: '#D1FAE5' },
    ];
  }, [products]);

  return (
    <div className="card">
      <div className="card-header" style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #E2E8F0' }}>
        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Sparkles size={18} color="#8B5CF6" />
          AI Catalog Insights
        </h3>
        <p style={{ margin: '2px 0 0', fontSize: '0.8125rem', color: '#64748B' }}>Track your AI content adoption</p>
      </div>
      
      <div className="card-body" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '1rem' }}>
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div key={idx} style={{ 
                background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: '1rem', 
                display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' 
              }}>
                <div style={{ 
                  width: 32, height: 32, borderRadius: '50%', background: stat.bg, color: stat.color, 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem' 
                }}>
                  <Icon size={16} />
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', lineHeight: 1 }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: '0.75rem', fontWeight: 500, color: '#64748B', marginTop: '0.25rem' }}>
                  {stat.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
