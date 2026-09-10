import { useState, useEffect, useCallback } from 'react';
import {
  ShoppingBag,
  Star,
  CheckCircle2,
  AlertCircle,
  MessageSquarePlus,
  Package,
  User,
  Sparkles,
  RefreshCw,
  Calendar,
  DollarSign,
  Store,
  Loader2
} from 'lucide-react';
import api from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';

// Conditionally import AiShoppingAssistantModal if it exists
let AiShoppingAssistantModal = null;
try {
  AiShoppingAssistantModal = require('../../components/AiShoppingAssistantModal').default;
} catch (e) {
  // Component not available — skip
}

export default function CustomerPurchases() {
  const { user } = useAuth();

  // Purchase data state
  const [purchases, setPurchases] = useState([]);
  const [reviews, setReviews] = useState({});  // productId -> review
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAiAssistant, setShowAiAssistant] = useState(false);

  // Review modal state
  const [activeProduct, setActiveProduct] = useState(null);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');
  const [modalSuccess, setModalSuccess] = useState('');

  // Fetch purchases for the authenticated customer
  const fetchPurchases = useCallback(async () => {
    setError('');
    try {
      const customerId = user?.id || user?._id;
      const res = await api.get('/transactions/my-purchases', {
        params: customerId ? { customerId } : {}
      });
      setPurchases(res.data.transactions || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load purchase history.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch existing reviews for the authenticated customer
  const fetchReviews = useCallback(async () => {
    try {
      // Try to get customer purchases with reviews from the legacy endpoint
      const customerId = user?._id || user?.id;
      if (!customerId) return;
      const res = await api.get(`/reviews/customer-purchases?customerId=${customerId}`);
      const data = res.data;
      // Build a map of productId -> review data
      const reviewMap = {};
      if (data.purchases) {
        data.purchases.forEach((p) => {
          if (p.hasReviewed && p.review) {
            reviewMap[p.productId] = p.review;
          }
        });
      }
      setReviews(reviewMap);
    } catch (err) {
      // Non-critical — reviews just won't show inline
      console.warn('Could not fetch reviews:', err.message);
    }
  }, [user]);

  useEffect(() => {
    fetchPurchases();
    fetchReviews();
  }, [fetchPurchases, fetchReviews]);

  function openReviewModal(purchase) {
    setActiveProduct(purchase);
    setRating(5);
    setReviewText('');
    setModalError('');
    setModalSuccess('');
  }

  async function handleReviewSubmit(e) {
    e.preventDefault();
    if (!activeProduct || !reviewText.trim()) return;

    setSubmitting(true);
    setModalError('');
    setModalSuccess('');

    try {
      await api.post('/reviews', {
        productId: activeProduct.productId,
        customerId: user?._id || user?.id,
        rating,
        reviewText
      });

      setModalSuccess('Review submitted and analyzed with LLM!');
      setTimeout(async () => {
        setActiveProduct(null);
        await fetchPurchases();
        await fetchReviews();
      }, 1500);

    } catch (err) {
      setModalError(err.response?.data?.message || 'Failed to submit review.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <LoadingSpinner message="Loading your purchase history..." />;

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0.5rem 0.5rem' }}>
      {/* Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
        borderRadius: 12,
        padding: '1.5rem',
        color: 'white',
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 4 }}>
            <ShoppingBag size={22} color="#818CF8" />
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'white' }}>
              My Purchases & Product Reviews
            </h2>
          </div>
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#94A3B8' }}>
            Submit authentic product reviews for completed purchases to trigger LLM sentiment analysis
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Logged-in user pill */}
          {user && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              background: 'rgba(255,255,255,0.1)', padding: '0.5rem 0.75rem',
              borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)'
            }}>
              <User size={16} color="#818CF8" />
              <div>
                <div style={{ fontSize: '0.8125rem', color: '#E2E8F0', fontWeight: 600, lineHeight: 1.2 }}>
                  {user.name || 'Customer'}
                </div>
                <div style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>{user.email}</div>
              </div>
            </div>
          )}

          {/* Refresh button */}
          <button
            onClick={() => { setLoading(true); fetchPurchases(); fetchReviews(); }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.5rem 0.875rem',
              background: 'rgba(255,255,255,0.12)',
              color: 'white', border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 8, fontSize: '0.8125rem', fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={14} />
            Refresh
          </button>

          {/* AI Shopping Assistant Modal Trigger */}
          {AiShoppingAssistantModal && (
            <button
              onClick={() => setShowAiAssistant(true)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.5rem 0.875rem', background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                color: 'white', border: 'none', borderRadius: 8, fontSize: '0.8125rem', fontWeight: 600,
                cursor: 'pointer', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
              }}
            >
              <Sparkles size={15} />
              AI Shopping Assistant
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>
          <AlertCircle size={16} />
          <div>{error}</div>
        </div>
      )}

      {/* Purchases Summary */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: '1rem'
      }}>
        <h3 style={{ margin: 0, fontSize: '1.0625rem', fontWeight: 700, color: '#0F172A' }}>
          Verified Purchases ({purchases.length})
        </h3>
        <span style={{
          background: '#EEF2FF', color: '#4F46E5',
          padding: '4px 10px', borderRadius: 6,
          fontSize: '0.75rem', fontWeight: 700
        }}>
          {Object.keys(reviews).length} Reviewed
        </span>
      </div>

      {/* Purchases list */}
      {purchases.length === 0 ? (
        <div style={{
          padding: '3rem', textAlign: 'center', background: '#F8FAFC',
          borderRadius: 12, border: '1px solid #E2E8F0'
        }}>
          <Package size={40} color="#94A3B8" style={{ marginBottom: '0.75rem' }} />
          <h4 style={{ margin: '0 0 4px', fontSize: '1rem', fontWeight: 600, color: '#0F172A' }}>
            No Purchases Yet
          </h4>
          <p style={{ margin: 0, color: '#64748B', fontSize: '0.875rem' }}>
            Visit the <a href="/marketplace" style={{ color: '#4F46E5', fontWeight: 600, textDecoration: 'none' }}>Marketplace</a> to make your first purchase.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {purchases.map((tx) => {
            const existingReview = reviews[tx.productId];
            const hasReview = !!existingReview;

            return (
              <div
                key={tx._id || tx.id}
                style={{
                  padding: '1.25rem',
                  border: hasReview ? '1px solid #BBF7D0' : '1px solid #E2E8F0',
                  background: hasReview ? '#F0FDF4' : 'white',
                  borderRadius: 10,
                  display: 'grid',
                  gridTemplateColumns: '80px 1fr auto',
                  gap: '1.25rem',
                  alignItems: 'center',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                }}
              >
                {/* Product Thumbnail */}
                <div style={{
                  width: 80, height: 80, borderRadius: 8, background: '#F1F5F9',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'
                }}>
                  {tx.imageUrl ? (
                    <img src={tx.imageUrl} alt={tx.productName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <Package size={32} color="#94A3B8" />
                  )}
                </div>

                {/* Product Details */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 4, flexWrap: 'wrap' }}>
                    <span style={{ background: '#E2E8F0', color: '#334155', padding: '1px 6px', borderRadius: 4, fontSize: '0.6875rem', fontWeight: 600 }}>
                      {tx.category}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Store size={12} /> {tx.vendorName}
                    </span>
                    <span style={{
                      background: '#DCFCE7', color: '#15803D',
                      padding: '1px 6px', borderRadius: 4, fontSize: '0.6875rem', fontWeight: 600
                    }}>
                      {tx.status}
                    </span>
                  </div>

                  <h4 style={{ margin: '0 0 6px', fontSize: '1rem', fontWeight: 700, color: '#0F172A' }}>
                    {tx.productName}
                  </h4>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.8125rem', color: '#64748B', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, color: '#0F172A' }}>${Number(tx.unitPrice).toFixed(2)}</span>
                    <span>Qty: {tx.quantity}</span>
                    <span style={{ fontWeight: 700, color: '#4F46E5' }}>
                      Total: ${Number(tx.totalAmount).toFixed(2)}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Calendar size={12} /> {new Date(tx.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Existing Review Preview */}
                  {hasReview && (
                    <div style={{ marginTop: '0.75rem', padding: '0.5rem 0.75rem', background: 'white', borderRadius: 6, border: '1px solid #DCFCE7' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 2 }}>
                        <span style={{
                          padding: '1px 6px', borderRadius: 4, fontSize: '0.6875rem', fontWeight: 700,
                          background: existingReview.sentiment === 'POSITIVE' ? '#D1FAE5' : existingReview.sentiment === 'NEGATIVE' ? '#FEE2E2' : '#FEF3C7',
                          color: existingReview.sentiment === 'POSITIVE' ? '#059669' : existingReview.sentiment === 'NEGATIVE' ? '#DC2626' : '#D97706'
                        }}>
                          {existingReview.sentiment} ({existingReview.sentimentScore}/100)
                        </span>
                        <span style={{ color: '#F59E0B', fontWeight: 600, fontSize: '0.75rem' }}>
                          {existingReview.rating} ⭐
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.8125rem', color: '#334155', fontStyle: 'italic' }}>
                        "{existingReview.summary || existingReview.reviewText}"
                      </p>
                    </div>
                  )}
                </div>

                {/* Action Column */}
                <div>
                  {hasReview ? (
                    <span style={{
                      background: '#DCFCE7', color: '#15803D',
                      padding: '6px 12px', borderRadius: 8, fontSize: '0.8125rem', fontWeight: 700,
                      display: 'inline-flex', alignItems: 'center', gap: 4
                    }}>
                      <CheckCircle2 size={16} /> Reviewed
                    </span>
                  ) : (
                    <button
                      onClick={() => openReviewModal(tx)}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                        padding: '0.5rem 0.875rem',
                        background: '#4F46E5', color: 'white',
                        border: 'none', borderRadius: 8,
                        fontSize: '0.8125rem', fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      <MessageSquarePlus size={14} /> Write a Review
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Review Submission Modal */}
      {activeProduct && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '1rem'
        }}>
          <div style={{
            maxWidth: 520, width: '100%', padding: '1.5rem',
            background: 'white', borderRadius: 12,
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Sparkles size={20} color="#4F46E5" />
              <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700, color: '#0F172A' }}>
                Write Product Review
              </h3>
            </div>
            <p style={{ margin: '0 0 1rem', fontSize: '0.8125rem', color: '#64748B' }}>
              Product: <strong>{activeProduct.productName}</strong> (Vendor: {activeProduct.vendorName})
            </p>

            {modalError && (
              <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
                <AlertCircle size={14} />
                <span>{modalError}</span>
              </div>
            )}

            {modalSuccess && (
              <div className="alert alert-success" style={{ marginBottom: '1rem' }}>
                <CheckCircle2 size={14} color="#16A34A" />
                <span>{modalSuccess}</span>
              </div>
            )}

            <form onSubmit={handleReviewSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#334155', marginBottom: 6, display: 'block' }}>
                  Your Rating (1 to 5 Stars)
                </label>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: 4 }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      style={{
                        background: rating >= star ? '#FEF3C7' : '#F1F5F9',
                        border: rating >= star ? '1px solid #F59E0B' : '1px solid #CBD5E1',
                        borderRadius: 6,
                        padding: '6px 12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        color: rating >= star ? '#D97706' : '#64748B'
                      }}
                    >
                      {star} <Star size={14} fill={rating >= star ? '#F59E0B' : 'none'} color="#F59E0B" />
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#334155', marginBottom: 6, display: 'block' }}>
                  Review Experience & Feedback
                </label>
                <textarea
                  className="form-input"
                  rows={4}
                  placeholder="Share details about product quality, performance, pros and cons (e.g. 'The keyboard keys are quiet and smooth, battery lasts long, but charging cable is short')..."
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  required
                  style={{ width: '100%', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setActiveProduct(null)}
                  disabled={submitting}
                  style={{
                    padding: '0.5rem 1rem',
                    background: '#F1F5F9', color: '#334155',
                    border: '1px solid #CBD5E1',
                    borderRadius: 8, fontSize: '0.8125rem', fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                    padding: '0.5rem 1.25rem',
                    background: submitting ? '#94A3B8' : '#4F46E5',
                    color: 'white', border: 'none',
                    borderRadius: 8, fontSize: '0.8125rem', fontWeight: 700,
                    cursor: submitting ? 'not-allowed' : 'pointer'
                  }}
                >
                  {submitting ? (
                    <>
                      <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                      Analyzing with LLM...
                    </>
                  ) : (
                    'Submit & Analyze'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RAG AI Shopping Assistant Modal */}
      {AiShoppingAssistantModal && (
        <AiShoppingAssistantModal
          isOpen={showAiAssistant}
          onClose={() => setShowAiAssistant(false)}
        />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

