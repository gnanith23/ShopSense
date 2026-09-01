import { useState, useEffect } from 'react';
import { TrendingUp, PieChart, Award, Download, RefreshCw, Layers } from 'lucide-react';
import api from '../api/api';

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount || 0);
}

export default function AdvancedAnalyticsCharts() {
  const [activeTab, setActiveTab] = useState('trend'); // 'trend' | 'category' | 'products'
  const [trendData, setTrendData] = useState(null);
  const [categoryData, setCategoryData] = useState(null);
  const [productData, setProductData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAllAnalytics();
  }, []);

  async function fetchAllAnalytics() {
    setLoading(true);
    setError('');
    try {
      const [trendRes, catRes, prodRes] = await Promise.all([
        api.get('/analytics/sales-trend'),
        api.get('/analytics/revenue-by-category'),
        api.get('/analytics/product-performance'),
      ]);

      setTrendData(trendRes.data);
      setCategoryData(catRes.data);
      setProductData(prodRes.data);
    } catch (err) {
      console.error('Failed to load advanced analytics:', err);
      setError(err.response?.data?.message || 'Failed to load analytics data.');
    } finally {
      setLoading(false);
    }
  }

  async function handleExportCSV() {
    setExporting(true);
    try {
      const response = await api.get('/analytics/export/csv', {
        responseType: 'blob',
      });

      // Create download link
      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'ShopSense_Sales_Report.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('CSV Export failed:', err);
      alert('Failed to export CSV report: ' + (err.response?.data?.message || err.message));
    } finally {
      setExporting(false);
    }
  }

  if (loading) {
    return (
      <div className="card" style={{ marginBottom: '1.5rem', padding: '2rem', textAlign: 'center' }}>
        <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 0.75rem', color: '#4F46E5' }} />
        <div style={{ fontSize: '0.875rem', color: '#64748B' }}>Loading advanced analytics & reports...</div>
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

  // Trend chart rendering calculations
  const trendPoints = trendData?.trend || [];
  const maxRevenue = Math.max(...(trendPoints.map(p => p.revenue) || [0]), 100);
  const maxUnits = Math.max(...(trendPoints.map(p => p.unitsSold) || [0]), 10);

  return (
    <div className="card" style={{ marginBottom: '1.5rem' }}>
      <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8, background: '#EEF2FF',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4F46E5'
          }}>
            <Layers size={18} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#0F172A' }}>
              Advanced Analytics & Reporting
            </h3>
            <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748B' }}>
              Chart-ready sales metrics, category breakdown & automated reporting
            </p>
          </div>
        </div>

        {/* Action buttons & Tab controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', background: '#F1F5F9', padding: '3px', borderRadius: 8, gap: '2px' }}>
            <button
              onClick={() => setActiveTab('trend')}
              style={{
                padding: '4px 10px', fontSize: '0.75rem', fontWeight: 600, borderRadius: 6, border: 'none', cursor: 'pointer',
                background: activeTab === 'trend' ? '#FFFFFF' : 'transparent',
                color: activeTab === 'trend' ? '#4F46E5' : '#64748B',
                boxShadow: activeTab === 'trend' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              <TrendingUp size={12} style={{ display: 'inline', marginRight: 4 }} />
              Sales Trend
            </button>
            <button
              onClick={() => setActiveTab('category')}
              style={{
                padding: '4px 10px', fontSize: '0.75rem', fontWeight: 600, borderRadius: 6, border: 'none', cursor: 'pointer',
                background: activeTab === 'category' ? '#FFFFFF' : 'transparent',
                color: activeTab === 'category' ? '#4F46E5' : '#64748B',
                boxShadow: activeTab === 'category' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              <PieChart size={12} style={{ display: 'inline', marginRight: 4 }} />
              Categories
            </button>
            <button
              onClick={() => setActiveTab('products')}
              style={{
                padding: '4px 10px', fontSize: '0.75rem', fontWeight: 600, borderRadius: 6, border: 'none', cursor: 'pointer',
                background: activeTab === 'products' ? '#FFFFFF' : 'transparent',
                color: activeTab === 'products' ? '#4F46E5' : '#64748B',
                boxShadow: activeTab === 'products' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              <Award size={12} style={{ display: 'inline', marginRight: 4 }} />
              Products
            </button>
          </div>

          <button
            onClick={handleExportCSV}
            disabled={exporting}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
              padding: '6px 12px', background: '#059669', color: 'white',
              border: 'none', borderRadius: 8, fontSize: '0.75rem', fontWeight: 600,
              cursor: exporting ? 'not-allowed' : 'pointer', transition: 'all 0.15s ease'
            }}
          >
            <Download size={14} />
            {exporting ? 'Exporting...' : 'Export CSV'}
          </button>
        </div>
      </div>

      <div className="card-body">
        {/* SUMMARY METRICS BAR */}
        {trendData?.summary && (
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '0.75rem', marginBottom: '1.25rem', background: '#F8FAFC', padding: '0.875rem',
            borderRadius: 8, border: '1px solid #E2E8F0'
          }}>
            <div>
              <div style={{ fontSize: '0.6875rem', color: '#64748B', fontWeight: 500 }}>Total Revenue</div>
              <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0F172A' }}>
                {formatCurrency(trendData.summary.totalRevenue)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.6875rem', color: '#64748B', fontWeight: 500 }}>Units Sold</div>
              <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#10B981' }}>
                {trendData.summary.totalUnitsSold}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.6875rem', color: '#64748B', fontWeight: 500 }}>Total Transactions</div>
              <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#6366F1' }}>
                {trendData.summary.totalTransactions}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.6875rem', color: '#64748B', fontWeight: 500 }}>Avg. Order Value</div>
              <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#EA580C' }}>
                {formatCurrency(trendData.summary.averageOrderValue)}
              </div>
            </div>
          </div>
        )}

        {/* TAB 1: SALES TREND */}
        {activeTab === 'trend' && (
          <div>
            {trendPoints.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#94A3B8', fontSize: '0.875rem' }}>
                No sales transactions recorded yet to plot historical trend.
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.75rem', color: '#64748B' }}>
                  <span>Daily Revenue & Unit Volume</span>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <span style={{ color: '#4F46E5', fontWeight: 600 }}>● Revenue (₹)</span>
                    <span style={{ color: '#10B981', fontWeight: 600 }}>■ Units Sold</span>
                  </div>
                </div>

                <div style={{ height: 180, width: '100%', position: 'relative' }}>
                  <svg style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                    {/* Grid lines */}
                    {[0, 0.5, 1].map((r) => (
                      <g key={r}>
                        <line x1="0" y1={140 * (1 - r)} x2="100%" y2={140 * (1 - r)} stroke="#E2E8F0" strokeDasharray="3 3" />
                        <text x="0" y={140 * (1 - r) - 3} fill="#94A3B8" fontSize="9">
                          {formatCurrency(maxRevenue * r)}
                        </text>
                      </g>
                    ))}

                    {/* Bars for Revenue */}
                    {trendPoints.map((item, idx) => {
                      const count = trendPoints.length;
                      const barWidth = Math.min(28, Math.max(12, 400 / count));
                      const xPercent = ((idx + 0.5) / count) * 100;
                      const hRev = (item.revenue / maxRevenue) * 120;
                      const yRev = 140 - hRev;

                      return (
                        <g key={item.date}>
                          <rect
                            x={`calc(${xPercent}% - ${barWidth / 2}px)`}
                            y={yRev}
                            width={barWidth}
                            height={Math.max(hRev, 4)}
                            rx="4"
                            fill="url(#revenueGrad)"
                          />
                          <text
                            x={`${xPercent}%`}
                            y={yRev - 4}
                            textAnchor="middle"
                            fill="#4F46E5"
                            fontSize="9"
                            fontWeight="700"
                          >
                            ₹{Math.round(item.revenue)}
                          </text>
                          <text
                            x={`${xPercent}%`}
                            y={155}
                            textAnchor="middle"
                            fill="#64748B"
                            fontSize="9"
                          >
                            {item.date}
                          </text>
                        </g>
                      );
                    })}

                    <defs>
                      <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#4F46E5" />
                        <stop offset="100%" stopColor="#818CF8" stopOpacity="0.7" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: REVENUE BY CATEGORY */}
        {activeTab === 'category' && (
          <div>
            {!categoryData?.categories?.length ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#94A3B8', fontSize: '0.875rem' }}>
                No category sales recorded yet.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                {categoryData.categories.map((cat) => (
                  <div
                    key={cat.category}
                    style={{
                      padding: '1rem', background: '#F8FAFC', borderRadius: 8,
                      border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '0.5rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600, color: '#0F172A', fontSize: '0.875rem' }}>{cat.category}</span>
                      <span style={{
                        padding: '2px 8px', borderRadius: 999, background: '#EEF2FF',
                        color: '#4F46E5', fontSize: '0.6875rem', fontWeight: 700
                      }}>
                        {cat.percentage}% of sales
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div style={{ width: '100%', height: 6, background: '#E2E8F0', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: `${cat.percentage}%`, height: '100%', background: '#4F46E5', borderRadius: 3 }} />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748B' }}>
                      <span>Revenue: <strong style={{ color: '#0F172A' }}>{formatCurrency(cat.revenue)}</strong></span>
                      <span>Units Sold: <strong style={{ color: '#0F172A' }}>{cat.unitsSold}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: PRODUCT PERFORMANCE */}
        {activeTab === 'products' && (
          <div>
            {!productData?.products?.length ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#94A3B8', fontSize: '0.875rem' }}>
                No individual product performance records found.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #E2E8F0', color: '#64748B', textAlign: 'left' }}>
                      <th style={{ padding: '8px 12px' }}>Product</th>
                      <th style={{ padding: '8px 12px' }}>Category</th>
                      <th style={{ padding: '8px 12px' }}>Unit Price</th>
                      <th style={{ padding: '8px 12px' }}>Units Sold</th>
                      <th style={{ padding: '8px 12px' }}>Total Revenue</th>
                      <th style={{ padding: '8px 12px' }}>Stock Left</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productData.products.map((p) => (
                      <tr key={p.productId} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '10px 12px', fontWeight: 600, color: '#0F172A' }}>{p.name}</td>
                        <td style={{ padding: '10px 12px', color: '#64748B' }}>{p.category}</td>
                        <td style={{ padding: '10px 12px' }}>{formatCurrency(p.price)}</td>
                        <td style={{ padding: '10px 12px', fontWeight: 600, color: '#10B981' }}>{p.unitsSold}</td>
                        <td style={{ padding: '10px 12px', fontWeight: 700, color: '#4F46E5' }}>{formatCurrency(p.totalRevenue)}</td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{
                            padding: '2px 6px', borderRadius: 4, fontSize: '0.6875rem', fontWeight: 600,
                            background: p.currentStock > 5 ? '#F0FDF4' : '#FEF2F2',
                            color: p.currentStock > 5 ? '#166534' : '#991B1B'
                          }}>
                            {p.currentStock} in stock
                          </span>
                        </td>
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
