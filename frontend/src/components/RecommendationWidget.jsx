import { useState, useEffect } from 'react';
import { BarChart2, Trophy, RefreshCw, Info, ChevronDown } from 'lucide-react';
import api from '../api/api';

// RecommendationWidget — Milestone 2 Requirement 3
// Rule-based recommendations: top-selling products per category.
// Uses GET /api/recommendations/categories + GET /api/recommendations/category/:cat
// NO AI — pure historical sales ranking.

function formatINR(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

const RANK_COLORS = ['#F59E0B', '#94A3B8', '#D97706'];
const RANK_LABELS = ['🥇', '🥈', '🥉'];

export default function RecommendationWidget() {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [recommendations, setRecommendations] = useState([]);
  const [dataStatus, setDataStatus] = useState('');
  const [catLoading, setCatLoading] = useState(true);
  const [recLoading, setRecLoading] = useState(false);
  const [catError, setCatError] = useState('');
  const [recError, setRecError] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    setCatLoading(true);
    setCatError('');
    try {
      const res = await api.get('/recommendations/categories');
      const cats = res.data.categories || [];
      setCategories(cats);
      if (cats.length > 0) {
        setSelectedCategory(cats[0]);
      }
    } catch (err) {
      setCatError(err.response?.data?.message || 'Unable to load product categories.');
    } finally {
      setCatLoading(false);
    }
  }

  useEffect(() => {
    if (selectedCategory) {
      fetchRecommendations(selectedCategory);
    }
  }, [selectedCategory]);

  async function fetchRecommendations(category) {
    setRecLoading(true);
    setRecError('');
    setRecommendations([]);
    setDataStatus('');
    try {
      const res = await api.get(`/recommendations/category/${encodeURIComponent(category)}?limit=5`);
      setRecommendations(res.data.recommendations || []);
      setDataStatus(res.data.dataStatus || 'OK');
    } catch (err) {
      setRecError(err.response?.data?.message || 'Unable to load recommendations.');
    } finally {
      setRecLoading(false);
    }
  }

  return (
    <div className="card" style={{ marginBottom: '1.5rem' }}>
      {/* Card header */}
      <div className="card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <BarChart2 size={16} color="#4F46E5" />
          <div>
            <h3 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 600, color: '#0F172A' }}>
              Rule-Based Recommendations
            </h3>
            <p style={{ margin: '1px 0 0', fontSize: '0.8125rem', color: '#64748B' }}>
              Top-selling products per category — based on historical sales, not AI
            </p>
          </div>
        </div>
        {/* NOT-AI badge */}
        <span style={{
          background: '#F0FDF4', color: '#059669',
          border: '1px solid #BBF7D0',
          padding: '3px 10px', borderRadius: 20,
          fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.03em',
          whiteSpace: 'nowrap',
        }}>
          📊 Rule-Based · No AI
        </span>
      </div>

      <div className="card-body">
        {/* Category loader error */}
        {catError && (
          <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
            {catError}
            <button onClick={fetchCategories} style={{ marginLeft: '0.5rem', background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626', padding: 0 }}>
              <RefreshCw size={13} />
            </button>
          </div>
        )}

        {/* Category selector */}
        {catLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748B', fontSize: '0.875rem', marginBottom: '1rem' }}>
            <div className="spinner spinner-dark" style={{ width: 16, height: 16, borderWidth: 2 }} />
            Loading categories...
          </div>
        ) : categories.length === 0 ? (
          <div className="alert alert-info" style={{ marginBottom: '1rem', alignItems: 'flex-start' }}>
            <Info size={16} style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <strong>No products found</strong>
              <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: '#1E40AF' }}>
                Add products to your catalog to see category recommendations.
              </p>
            </div>
          </div>
        ) : (
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ fontSize: '0.8125rem', fontWeight: 500, color: '#374151', display: 'block', marginBottom: '0.375rem' }}>
              Select Category
            </label>
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                style={{
                  appearance: 'none',
                  background: 'white',
                  border: '1px solid #D1D5DB',
                  borderRadius: 8,
                  padding: '0.5rem 2.25rem 0.5rem 0.875rem',
                  fontSize: '0.875rem',
                  color: '#0F172A',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontWeight: 500,
                  minWidth: 200,
                  outline: 'none',
                }}
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <ChevronDown size={15} color="#64748B" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            </div>
          </div>
        )}

        {/* Recommendations results */}
        {recLoading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748B', fontSize: '0.875rem', padding: '1rem 0' }}>
            <div className="spinner spinner-dark" style={{ width: 18, height: 18, borderWidth: 2 }} />
            Loading recommendations for <strong style={{ color: '#0F172A', marginLeft: 3 }}>{selectedCategory}</strong>...
          </div>
        )}

        {recError && !recLoading && (
          <div className="alert alert-error">
            {recError}
            <button onClick={() => fetchRecommendations(selectedCategory)} style={{ marginLeft: '0.5rem', background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626', padding: 0 }}>
              <RefreshCw size={13} />
            </button>
          </div>
        )}

        {!recLoading && !recError && dataStatus === 'INSUFFICIENT_DATA' && (
          <div className="alert alert-info" style={{ alignItems: 'flex-start' }}>
            <Info size={16} style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <strong>No sales history for this category yet</strong>
              <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: '#1E40AF' }}>
                Recommendations for <strong>{selectedCategory}</strong> will appear once there are completed transactions for products in this category.
              </p>
            </div>
          </div>
        )}

        {!recLoading && !recError && dataStatus === 'OK' && recommendations.length > 0 && (
          <>
            <div style={{ fontSize: '0.8125rem', color: '#64748B', marginBottom: '0.75rem' }}>
              Top {recommendations.length} products in <strong style={{ color: '#4F46E5' }}>{selectedCategory}</strong> by units sold
            </div>

            {/* Ranked product list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {recommendations.map((item, idx) => {
                const isTop3 = idx < 3;
                return (
                  <div
                    key={item.productId}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.875rem',
                      padding: '0.75rem 1rem', borderRadius: 10,
                      background: idx === 0 ? '#FFFBEB' : '#F8FAFC',
                      border: `1px solid ${idx === 0 ? '#FDE68A' : '#E2E8F0'}`,
                    }}
                  >
                    {/* Rank */}
                    <div style={{
                      width: 32, height: 32, borderRadius: 8,
                      background: isTop3 ? '#EEF2FF' : '#F1F5F9',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                      fontSize: isTop3 ? '1rem' : '0.875rem',
                      fontWeight: 700,
                      color: isTop3 ? RANK_COLORS[idx] : '#94A3B8',
                    }}>
                      {isTop3 ? RANK_LABELS[idx] : `#${item.rank}`}
                    </div>

                    {/* Product info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: 1 }}>
                        Revenue: {formatINR(item.totalRevenue)}
                      </div>
                    </div>

                    {/* Units sold */}
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: '1.125rem', fontWeight: 700, color: idx === 0 ? '#D97706' : '#4F46E5', lineHeight: 1 }}>
                        {item.unitsSold}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#94A3B8', marginTop: 1 }}>
                        units sold
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <p style={{ margin: '0.875rem 0 0', fontSize: '0.75rem', color: '#94A3B8', borderTop: '1px solid #F1F5F9', paddingTop: '0.875rem' }}>
              Rankings calculated from completed transaction history. Not AI-generated.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
