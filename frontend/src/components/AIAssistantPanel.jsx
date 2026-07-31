import { useMemo } from 'react';
import { Bot, Image as ImageIcon, Package, Sparkles, TrendingDown, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AIAssistantPanel({ products = [], analytics = null }) {
  const suggestions = useMemo(() => {
    const list = [];
    
    // Rule 1: Missing Images
    const missingImages = products.filter(p => !p.imageUrl).length;
    if (missingImages > 0) {
      list.push({
        id: 'missing-images',
        icon: ImageIcon,
        title: 'Add Product Images',
        description: `You have ${missingImages} product${missingImages > 1 ? 's' : ''} without images. Products with images sell 3x faster.`,
        color: '#EF4444', // Red
        bg: '#FEF2F2',
        action: '/vendor/catalog'
      });
    }

    // Rule 2: Low Stock
    const lowStock = products.filter(p => p.stock < 5 && p.stock > 0).length;
    const outOfStock = products.filter(p => p.stock === 0).length;
    
    if (outOfStock > 0) {
      list.push({
        id: 'out-of-stock',
        icon: Package,
        title: 'Out of Stock',
        description: `${outOfStock} product${outOfStock > 1 ? 's are' : ' is'} out of stock. Restock to prevent lost sales.`,
        color: '#EF4444',
        bg: '#FEF2F2',
        action: '/vendor/catalog'
      });
    } else if (lowStock > 0) {
      list.push({
        id: 'low-stock',
        icon: Package,
        title: 'Low Stock Alert',
        description: `${lowStock} product${lowStock > 1 ? 's have' : ' has'} less than 5 units left. Consider restocking soon.`,
        color: '#F59E0B', // Orange
        bg: '#FFFBEB',
        action: '/vendor/catalog'
      });
    }

    // Rule 3: Missing AI Content (SEO/Tags)
    const missingAI = products.filter(p => !p.aiTags?.length || !p.seoKeywords?.length).length;
    if (missingAI > 0) {
      list.push({
        id: 'missing-ai',
        icon: Sparkles,
        title: 'Boost SEO with AI',
        description: `Generate AI descriptions and SEO keywords for ${missingAI} product${missingAI > 1 ? 's' : ''} to improve discoverability.`,
        color: '#10B981', // Green
        bg: '#ECFDF5',
        action: '/vendor/catalog'
      });
    }

    // Rule 4: Zero Sales
    if (products.length > 0 && (!analytics || analytics.totalSales === 0)) {
      list.push({
        id: 'zero-sales',
        icon: TrendingDown,
        title: 'Kickstart Your Sales',
        description: 'Your catalog has 0 sales. Consider optimizing product titles or sharing your links.',
        color: '#3B82F6', // Blue
        bg: '#EFF6FF',
        action: '/vendor/catalog'
      });
    }

    return list;
  }, [products, analytics]);

  return (
    <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="card-header" style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ background: '#F1F5F9', padding: '0.5rem', borderRadius: 8, color: '#4F46E5', display: 'flex' }}>
          <Bot size={20} />
        </div>
        <div>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#0F172A' }}>AI Assistant</h3>
          <p style={{ margin: '2px 0 0', fontSize: '0.8125rem', color: '#64748B' }}>Smart suggestions to grow your business</p>
        </div>
      </div>
      
      <div className="card-body" style={{ padding: '1rem 1.5rem', flex: 1, overflowY: 'auto' }}>
        {suggestions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem 0', color: '#64748B' }}>
            <Sparkles size={32} style={{ margin: '0 auto 1rem', color: '#10B981', opacity: 0.5 }} />
            <p style={{ fontSize: '0.875rem', margin: 0 }}>Your catalog is perfectly optimized!</p>
            <p style={{ fontSize: '0.8125rem', marginTop: 4 }}>Check back later for more AI suggestions.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {suggestions.map(sug => {
              const Icon = sug.icon;
              return (
                <div key={sug.id} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div style={{ 
                    width: 36, height: 36, borderRadius: '50%', background: sug.bg, color: sug.color, 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 
                  }}>
                    <Icon size={18} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '0.875rem', fontWeight: 600, color: '#1E293B' }}>{sug.title}</h4>
                    <p style={{ margin: 0, fontSize: '0.8125rem', color: '#475569', lineHeight: 1.5 }}>
                      {sug.description}
                    </p>
                    <Link to={sug.action} style={{ 
                      display: 'inline-flex', alignItems: 'center', gap: '0.25rem', 
                      fontSize: '0.75rem', fontWeight: 500, color: sug.color, marginTop: '0.5rem', textDecoration: 'none'
                    }}>
                      Take action <ArrowRight size={12} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
