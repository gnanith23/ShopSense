import { useState, useEffect } from 'react';
import {
  MessageSquare,
  ThumbsUp,
  MinusCircle,
  ThumbsDown,
  Sparkles,
  RefreshCw,
  PlusCircle,
  Star,
  CheckCircle2,
  XCircle,
  AlertCircle,
  TrendingUp
} from 'lucide-react';
import api from '../api/api';
import LoadingSpinner from './LoadingSpinner';

export default function SentimentDashboardWidget() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzingAll, setAnalyzingAll] = useState(false);
  const [error, setError] = useState('');
  const [products, setProducts] = useState([]);

  // Create review modal/form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    productId: '',
    rating: 5,
    reviewText: '',
    customerName: '',
    customerEmail: ''
  });
  const [formSuccess, setFormSuccess] = useState('');

  useEffect(() => {
    fetchSentimentSummary();
    fetchProducts();
  }, []);

  async function fetchSentimentSummary() {
    try {
      setError('');
      const res = await api.get('/reviews/vendor/sentiment-summary');
      setSummary(res.data.summary);
    } catch (err) {
      if (err.response?.status === 404) {
        setError('Endpoint not found. Please restart your backend server (ctrl+c then npm start in backend) to load the new routes.');
      } else {
        setError(err.response?.data?.message || 'Failed to load sentiment summary.');
      }
    } finally {
      setLoading(false);
    }
  }

  async function fetchProducts() {
    try {
      const res = await api.get('/products/my-products');
      setProducts(res.data.products || []);
      if (res.data.products?.length > 0) {
        setReviewForm((prev) => ({ ...prev, productId: res.data.products[0]._id }));
      }
    } catch (err) {
      console.error('Failed to load vendor products for review form:', err);
    }
  }

  async function handleAnalyzeAll() {
    setAnalyzingAll(true);
    try {
      const res = await api.post('/reviews/vendor/analyze-all');
      await fetchSentimentSummary();
      alert(res.data.message || 'Bulk review analysis completed!');
    } catch (err) {
      alert(err.response?.data?.message || 'Bulk analysis failed.');
    } finally {
      setAnalyzingAll(false);
    }
  }

  async function handleCreateReview(e) {
    e.preventDefault();
    if (!reviewForm.productId || !reviewForm.reviewText.trim()) return;

    setSubmittingReview(true);
    setFormSuccess('');
    try {
      const res = await api.post('/reviews', reviewForm);
      setFormSuccess('Review submitted and analyzed with LLM!');
      setReviewForm({
        productId: products[0]?._id || '',
        rating: 5,
        reviewText: '',
        customerName: '',
        customerEmail: ''
      });
      await fetchSentimentSummary();
      setTimeout(() => setFormSuccess(''), 4000);
      setShowAddModal(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit review.');
    } finally {
      setSubmittingReview(false);
    }
  }

  if (loading) return <LoadingSpinner message="Loading sentiment analytics..." />;

  if (error) {
    return (
      <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>
        <AlertCircle size={16} />
        <div>{error}</div>
      </div>
    );
  }

  const {
    totalReviews = 0,
    positiveCount = 0,
    neutralCount = 0,
    negativeCount = 0,
    averageSentimentScore = 0,
    averageRating = 0,
    topPros = [],
    topCons = [],
    recentReviews = []
  } = summary || {};

  return (
    <div className="card" style={{ marginBottom: '1.5rem', overflow: 'hidden' }}>
      {/* Header Banner */}
      <div style={{
        padding: '1.25rem 1.5rem',
        background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
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
            background: 'rgba(99, 102, 241, 0.2)',
            border: '1px solid rgba(129, 140, 248, 0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Sparkles size={22} color="#818CF8" />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.0625rem', fontWeight: 700, color: 'white' }}>
              LLM Review Sentiment Analysis
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: '0.8125rem', color: '#94A3B8' }}>
              AI-driven customer feedback extraction, pros & cons summary, and sentiment score
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={handleAnalyzeAll}
            disabled={analyzingAll}
            style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }}
          >
            <RefreshCw size={14} className={analyzingAll ? 'spin' : ''} />
            {analyzingAll ? 'Analyzing...' : 'Re-Analyze Reviews'}
          </button>
        </div>
      </div>

      <div style={{ padding: '1.5rem' }}>
        {/* Metric Cards Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem'
        }}>
          {/* Total Reviews */}
          <div style={{ padding: '1rem', background: '#F8FAFC', borderRadius: 10, border: '1px solid #E2E8F0' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B' }}>TOTAL REVIEWS</span>
              <MessageSquare size={16} color="#6366F1" />
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', marginTop: 4 }}>
              {totalReviews}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: 2 }}>
              Avg Rating: {averageRating} / 5 ⭐
            </div>
          </div>

          {/* Sentiment Score */}
          <div style={{ padding: '1rem', background: '#F0F9FF', borderRadius: 10, border: '1px solid #BAE6FD' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#0369A1' }}>SENTIMENT SCORE</span>
              <TrendingUp size={16} color="#0284C7" />
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0369A1', marginTop: 4 }}>
              {averageSentimentScore} / 100
            </div>
            <div style={{ fontSize: '0.75rem', color: '#0284C7', marginTop: 2 }}>
              Overall Customer Satisfaction
            </div>
          </div>

          {/* Positive */}
          <div style={{ padding: '1rem', background: '#F0FDF4', borderRadius: 10, border: '1px solid #BBF7D0' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#15803D' }}>POSITIVE</span>
              <ThumbsUp size={16} color="#16A34A" />
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#15803D', marginTop: 4 }}>
              {positiveCount}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#16A34A', marginTop: 2 }}>
              {totalReviews > 0 ? Math.round((positiveCount / totalReviews) * 100) : 0}% of total
            </div>
          </div>

          {/* Neutral */}
          <div style={{ padding: '1rem', background: '#FEFCE8', borderRadius: 10, border: '1px solid #FEF08A' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#A16207' }}>NEUTRAL</span>
              <MinusCircle size={16} color="#CA8A04" />
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#A16207', marginTop: 4 }}>
              {neutralCount}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#CA8A04', marginTop: 2 }}>
              {totalReviews > 0 ? Math.round((neutralCount / totalReviews) * 100) : 0}% of total
            </div>
          </div>

          {/* Negative */}
          <div style={{ padding: '1rem', background: '#FEF2F2', borderRadius: 10, border: '1px solid #FECACA' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#B91C1C' }}>NEGATIVE</span>
              <ThumbsDown size={16} color="#DC2626" />
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#B91C1C', marginTop: 4 }}>
              {negativeCount}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#DC2626', marginTop: 2 }}>
              {totalReviews > 0 ? Math.round((negativeCount / totalReviews) * 100) : 0}% of total
            </div>
          </div>
        </div>

        {/* Top Pros & Cons Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
          {/* Top Pros */}
          <div style={{ padding: '1rem', background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <CheckCircle2 size={16} color="#16A34A" />
              <h4 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: '#0F172A' }}>
                Top Mentioned Pros
              </h4>
            </div>
            {topPros.length === 0 ? (
              <div style={{ fontSize: '0.8125rem', color: '#94A3B8' }}>No pros analyzed yet.</div>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                {topPros.map((item, i) => (
                  <span key={i} style={{
                    background: '#DCFCE7', color: '#15803D',
                    padding: '3px 8px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600
                  }}>
                    + {item.text} ({item.count})
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Top Cons */}
          <div style={{ padding: '1rem', background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <XCircle size={16} color="#DC2626" />
              <h4 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: '#0F172A' }}>
                Top Mentioned Cons
              </h4>
            </div>
            {topCons.length === 0 ? (
              <div style={{ fontSize: '0.8125rem', color: '#94A3B8' }}>No cons reported.</div>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                {topCons.map((item, i) => (
                  <span key={i} style={{
                    background: '#FEE2E2', color: '#B91C1C',
                    padding: '3px 8px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600
                  }}>
                    - {item.text} ({item.count})
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Analyzed Reviews Table */}
        <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.9375rem', fontWeight: 600, color: '#0F172A' }}>
          Recent Analyzed Reviews
        </h4>

        {recentReviews.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', background: '#F8FAFC', borderRadius: 8 }}>
            <p style={{ margin: 0, color: '#64748B', fontSize: '0.875rem' }}>
              No customer reviews submitted yet. Customers can review products from their <strong>"My Purchases"</strong> Customer Portal.
            </p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Customer</th>
                  <th>Rating</th>
                  <th>Sentiment</th>
                  <th>Score</th>
                  <th>AI Summary & Pros/Cons</th>
                </tr>
              </thead>
              <tbody>
                {recentReviews.map((rev) => (
                  <tr key={rev._id}>
                    <td style={{ fontWeight: 600, color: '#0F172A' }}>
                      {rev.product?.name || 'Product'}
                    </td>
                    <td>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 500 }}>
                        {rev.customer?.name || 'Customer'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                        {rev.customer?.email}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 2, color: '#F59E0B', fontWeight: 600 }}>
                        {rev.rating} <Star size={12} fill="#F59E0B" />
                      </div>
                    </td>
                    <td>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: 6,
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        background:
                          rev.sentiment === 'POSITIVE' ? '#D1FAE5' :
                          rev.sentiment === 'NEGATIVE' ? '#FEE2E2' : '#FEF3C7',
                        color:
                          rev.sentiment === 'POSITIVE' ? '#059669' :
                          rev.sentiment === 'NEGATIVE' ? '#DC2626' : '#D97706'
                      }}>
                        {rev.sentiment}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700, color: '#4F46E5' }}>
                      {rev.sentimentScore} / 100
                    </td>
                    <td style={{ maxWidth: 320 }}>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 500, color: '#1E293B', marginBottom: 4 }}>
                        "{rev.summary || rev.reviewText}"
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                        {(rev.pros || []).map((p, idx) => (
                          <span key={idx} style={{ background: '#F0FDF4', color: '#16A34A', fontSize: '0.6875rem', padding: '1px 5px', borderRadius: 4 }}>
                            + {p}
                          </span>
                        ))}
                        {(rev.cons || []).map((c, idx) => (
                          <span key={idx} style={{ background: '#FEF2F2', color: '#DC2626', fontSize: '0.6875rem', padding: '1px 5px', borderRadius: 4 }}>
                            - {c}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Review Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '1rem'
        }}>
          <div className="card" style={{ maxWidth: 500, width: '100%', padding: '1.5rem', background: 'white' }}>
            <h3 style={{ margin: '0 0 1rem', fontSize: '1.125rem', fontWeight: 700, color: '#0F172A' }}>
              Create Customer Review
            </h3>

            {formSuccess && (
              <div className="alert alert-success" style={{ marginBottom: '1rem' }}>
                {formSuccess}
              </div>
            )}

            <form onSubmit={handleCreateReview}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Select Product</label>
                <select
                  className="form-input"
                  value={reviewForm.productId}
                  onChange={(e) => setReviewForm({ ...reviewForm, productId: e.target.value })}
                  required
                >
                  {products.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} (${p.price})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Rating (1 to 5 Stars)</label>
                <select
                  className="form-input"
                  value={reviewForm.rating}
                  onChange={(e) => setReviewForm({ ...reviewForm, rating: Number(e.target.value) })}
                >
                  <option value={5}>5 Stars - Excellent</option>
                  <option value={4}>4 Stars - Very Good</option>
                  <option value={3}>3 Stars - Average</option>
                  <option value={2}>2 Stars - Poor</option>
                  <option value={1}>1 Star - Terrible</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Customer Name & Email (Optional)</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Customer Name"
                    value={reviewForm.customerName}
                    onChange={(e) => setReviewForm({ ...reviewForm, customerName: e.target.value })}
                  />
                  <input
                    type="email"
                    className="form-input"
                    placeholder="Customer Email"
                    value={reviewForm.customerEmail}
                    onChange={(e) => setReviewForm({ ...reviewForm, customerEmail: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label">Review Text</label>
                <textarea
                  className="form-input"
                  rows={4}
                  placeholder="Enter detailed customer feedback (e.g. 'This gaming keyboard is super fast and smooth, but the keys are a bit loud')..."
                  value={reviewForm.reviewText}
                  onChange={(e) => setReviewForm({ ...reviewForm, reviewText: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAddModal(false)}
                  disabled={submittingReview}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submittingReview}
                >
                  {submittingReview ? 'Analyzing with LLM...' : 'Submit & Analyze'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
