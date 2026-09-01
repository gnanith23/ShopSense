import { useState, useEffect } from 'react';
import { Sparkles, User, Package, RefreshCw, Layers, CheckCircle } from 'lucide-react';
import api from '../api/api';
import LoadingSpinner from './LoadingSpinner';

export default function VectorRecommendationWidget() {
  const [recommendations, setRecommendations] = useState([]);
  const [targetCustomer, setTargetCustomer] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCustomers();
    fetchVectorRecommendations('');
  }, []);

  async function fetchCustomers() {
    try {
      const res = await api.get('/customers');
      setCustomers(res.data.customers || []);
    } catch (err) {
      console.warn('Could not fetch customer list for vector picker:', err);
    }
  }

  async function fetchVectorRecommendations(customerId = '') {
    setRefreshing(true);
    try {
      setError('');
      const url = customerId ? `/recommendations/vector?customerId=${customerId}` : '/recommendations/vector';
      const res = await api.get(url);
      setRecommendations(res.data.recommendations || []);
      setTargetCustomer(res.data.customer || null);
    } catch (err) {
      if (err.response?.status === 404) {
        setError('Endpoint not found. Please restart your backend server (ctrl+c then npm start in backend) to load the new vector routes.');
      } else {
        setError(err.response?.data?.message || 'Failed to load vector recommendations.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  function handleCustomerChange(e) {
    const cid = e.target.value;
    setSelectedCustomerId(cid);
    fetchVectorRecommendations(cid);
  }

  if (loading) return <LoadingSpinner message="Generating semantic vector recommendations..." />;

  return (
    <div className="card" style={{ marginBottom: '1.5rem', overflow: 'hidden' }}>
      {/* Header Banner */}
      <div style={{
        padding: '1.25rem 1.5rem',
        background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: 'rgba(255, 255, 255, 0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Sparkles size={22} color="white" />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.0625rem', fontWeight: 700, color: 'white' }}>
              AI / Semantic Vector Recommendations
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: '0.8125rem', color: 'rgba(255, 255, 255, 0.85)' }}>
              768-dimensional vector similarity matching based on customer transaction behavior
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Customer Selector */}
          {customers.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <User size={14} color="white" />
              <select
                value={selectedCustomerId}
                onChange={handleCustomerChange}
                style={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  color: 'white',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: 6,
                  padding: '4px 8px',
                  fontSize: '0.8125rem',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="" style={{ color: '#0F172A' }}>Auto Selected Active Customer</option>
                {customers.map((c) => (
                  <option key={c._id} value={c._id} style={{ color: '#0F172A' }}>
                    {c.name} ({c.email})
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            className="btn btn-secondary btn-sm"
            onClick={() => fetchVectorRecommendations(selectedCustomerId)}
            disabled={refreshing}
            style={{ background: 'rgba(255, 255, 255, 0.2)', color: 'white', border: '1px solid rgba(255, 255, 255, 0.3)' }}
          >
            <RefreshCw size={14} className={refreshing ? 'spin' : ''} />
            Recalculate
          </button>
        </div>
      </div>

      <div style={{ padding: '1.5rem' }}>
        {/* Customer Context Info */}
        {targetCustomer && (
          <div style={{
            padding: '0.75rem 1rem',
            background: '#F0F9FF',
            border: '1px solid #BAE6FD',
            borderRadius: 8,
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.8125rem',
            color: '#0369A1'
          }}>
            <div>
              <strong>Context Customer:</strong> {targetCustomer.name} ({targetCustomer.email})
            </div>
            <span style={{
              background: '#0284C7', color: 'white',
              padding: '2px 8px', borderRadius: 4, fontSize: '0.6875rem', fontWeight: 600
            }}>
              VECTOR_SEMANTIC
            </span>
          </div>
        )}

        {error && (
          <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        {/* Product Cards Grid */}
        {recommendations.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', background: '#F8FAFC', borderRadius: 8 }}>
            <Package size={32} color="#94A3B8" style={{ marginBottom: '0.5rem' }} />
            <p style={{ margin: 0, color: '#94A3B8', fontSize: '0.875rem' }}>
              No in-stock products found matching vector criteria.
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1.25rem'
          }}>
            {recommendations.map((item) => (
              <div
                key={item.productId}
                style={{
                  border: '1px solid #E2E8F0',
                  borderRadius: 10,
                  padding: '1.25rem',
                  background: 'white',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
                className="hover-card"
              >
                <div>
                  {/* Top row: Rank badge & Match score */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <span style={{
                      background: '#EEF2FF', color: '#4F46E5',
                      padding: '2px 8px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 700
                    }}>
                      Rank #{item.rank}
                    </span>
                    <span style={{
                      background: '#D1FAE5', color: '#059669',
                      padding: '2px 8px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 700,
                      display: 'inline-flex', alignItems: 'center', gap: 4
                    }}>
                      <CheckCircle size={12} /> {item.matchPercentage}% Match
                    </span>
                  </div>

                  {/* Product Title & Category */}
                  <h4 style={{ margin: '0 0 4px', fontSize: '0.9375rem', fontWeight: 700, color: '#0F172A' }}>
                    {item.name}
                  </h4>
                  <span style={{
                    display: 'inline-block',
                    background: '#F1F5F9', color: '#475569',
                    padding: '1px 6px', borderRadius: 4, fontSize: '0.6875rem', fontWeight: 500,
                    marginBottom: '0.75rem'
                  }}>
                    {item.category}
                  </span>

                  {/* Reason rationale */}
                  <p style={{
                    margin: '0 0 1rem', fontSize: '0.8125rem', color: '#64748B', lineHeight: 1.4,
                    background: '#F8FAFC', padding: '0.5rem 0.75rem', borderRadius: 6, borderLeft: '3px solid #6366F1'
                  }}>
                    {item.reason}
                  </p>
                </div>

                {/* Bottom row: Price & Stock Status */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  borderTop: '1px solid #F1F5F9', paddingTop: '0.75rem'
                }}>
                  <div style={{ fontSize: '1.0625rem', fontWeight: 700, color: '#0F172A' }}>
                    ${Number(item.price).toFixed(2)}
                  </div>
                  <span style={{
                    fontSize: '0.75rem', fontWeight: 600, color: '#059669', background: '#D1FAE5',
                    padding: '2px 6px', borderRadius: 4
                  }}>
                    In Stock ({item.stock})
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
