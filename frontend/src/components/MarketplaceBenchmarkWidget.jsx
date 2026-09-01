import { useState, useEffect } from 'react';
import { Target, TrendingUp, TrendingDown, Minus, RefreshCw, BarChart2, ShieldCheck } from 'lucide-react';
import api from '../api/api';

function formatVal(val, unit) {
  if (unit === '₹') {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(val || 0);
  }
  return `${(val || 0).toLocaleString()} ${unit}`;
}

export default function MarketplaceBenchmarkWidget() {
  const [benchmark, setBenchmark] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBenchmark();
  }, []);

  async function fetchBenchmark() {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/analytics/benchmark');
      setBenchmark(res.data);
    } catch (err) {
      console.error('Failed to fetch benchmark:', err);
      setError(err.response?.data?.message || 'Failed to calculate marketplace benchmark.');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="card" style={{ marginBottom: '1.5rem', padding: '2rem', textAlign: 'center' }}>
        <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 0.75rem', color: '#059669' }} />
        <div style={{ fontSize: '0.875rem', color: '#64748B' }}>Computing marketplace benchmarks...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>
        {error}
      </div>
    );
  }

  const metrics = benchmark?.metrics || {};
  const metricKeys = ['revenue', 'unitsSold', 'transactions', 'averageOrderValue'];

  return (
    <div className="card" style={{ marginBottom: '1.5rem' }}>
      <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8, background: '#F0FDF4',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669'
          }}>
            <Target size={18} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#0F172A' }}>
              Marketplace Benchmarking
            </h3>
            <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748B' }}>
              Compare your store performance directly against marketplace peer averages
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{
            fontSize: '0.6875rem', fontWeight: 600, padding: '3px 8px', borderRadius: 6,
            background: '#F1F5F9', color: '#475569'
          }}>
            {benchmark?.comparisonBasis} ({benchmark?.otherVendorsCount || 0} Peer Vendors)
          </span>
          <button
            onClick={fetchBenchmark}
            style={{
              background: 'transparent', border: '1px solid #E2E8F0', borderRadius: 6,
              padding: '4px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center'
            }}
            title="Refresh Benchmarks"
          >
            <RefreshCw size={12} color="#64748B" />
          </button>
        </div>
      </div>

      <div className="card-body">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
          marginBottom: '1rem'
        }}>
          {metricKeys.map((key) => {
            const item = metrics[key];
            if (!item) return null;

            const isAbove = item.status === 'above';
            const isBelow = item.status === 'below';

            return (
              <div
                key={key}
                style={{
                  padding: '1rem',
                  background: '#F8FAFC',
                  borderRadius: 10,
                  border: '1px solid #E2E8F0',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.625rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B' }}>
                    {item.label}
                  </span>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 3,
                    padding: '2px 7px', borderRadius: 999, fontSize: '0.6875rem', fontWeight: 700,
                    background: isAbove ? '#DCFCE7' : isBelow ? '#FEE2E2' : '#F1F5F9',
                    color: isAbove ? '#166534' : isBelow ? '#991B1B' : '#475569'
                  }}>
                    {isAbove && <TrendingUp size={11} />}
                    {isBelow && <TrendingDown size={11} />}
                    {!isAbove && !isBelow && <Minus size={11} />}
                    {item.percentageDifference > 0 ? `+${item.percentageDifference}%` : `${item.percentageDifference}%`}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 2 }}>
                  <div>
                    <div style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>Your Store</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0F172A' }}>
                      {formatVal(item.vendor, item.unit)}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>Market Avg</div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#64748B' }}>
                      {formatVal(item.marketplaceAvg, item.unit)}
                    </div>
                  </div>
                </div>

                <div style={{
                  padding: '6px 8px', background: '#FFFFFF', borderRadius: 6,
                  border: '1px solid #E2E8F0', fontSize: '0.6875rem', color: '#475569'
                }}>
                  Variance: <strong style={{ color: isAbove ? '#16A34A' : isBelow ? '#DC2626' : '#64748B' }}>
                    {item.difference > 0 ? `+${formatVal(item.difference, item.unit)}` : formatVal(item.difference, item.unit)}
                  </strong> vs market
                </div>
              </div>
            );
          })}
        </div>

        {/* Insight note */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          padding: '0.75rem 1rem', background: '#F0FDF4', borderRadius: 8, border: '1px solid #BBF7D0'
        }}>
          <ShieldCheck size={16} color="#16A34A" style={{ flexShrink: 0 }} />
          <span style={{ fontSize: '0.75rem', color: '#166534', lineHeight: 1.4 }}>
            Marketplace averages are derived live from active vendor transaction records in MongoDB. Your data is isolated and safely compared.
          </span>
        </div>
      </div>
    </div>
  );
}
