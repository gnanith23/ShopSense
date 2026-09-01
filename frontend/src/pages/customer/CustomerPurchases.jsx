import { useState, useEffect } from 'react';
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
  Store
} from 'lucide-react';
import api from '../../api/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import AiShoppingAssistantModal from '../../components/AiShoppingAssistantModal';

export default function CustomerPurchases() {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [purchasesData, setPurchasesData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchingPurchases, setFetchingPurchases] = useState(false);
  const [error, setError] = useState('');
  const [showAiAssistant, setShowAiAssistant] = useState(false);


  // Review modal state
  const [activeProduct, setActiveProduct] = useState(null);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');
  const [modalSuccess, setModalSuccess] = useState('');

  useEffect(() => {
    fetchCustomers();
  }, []);

  async function fetchCustomers() {
    try {
      const res = await api.get('/customers');
      const list = res.data.customers || [];
      setCustomers(list);
      if (list.length > 0) {
        setSelectedCustomerId(list[0]._id);
        fetchPurchases(list[0]._id);
      } else {
        setLoading(false);
      }
    } catch (err) {
      console.error('Failed to load customers:', err);
      setError('Could not load customer profiles.');
      setLoading(false);
    }
  }

  async function fetchPurchases(cid) {
    setFetchingPurchases(true);
    setError('');
    try {
      const res = await api.get(`/reviews/customer-purchases?customerId=${cid}`);
      setPurchasesData(res.data);
    } catch (err) {
      if (err.response?.status === 404) {
        setError('Endpoint not found. Please restart your backend server (ctrl+c then npm start in backend) to load the new routes.');
      } else {
        setError(err.response?.data?.message || 'Failed to load customer purchases.');
      }
    } finally {
      setLoading(false);
      setFetchingPurchases(false);
    }
  }

  function handleCustomerSelect(e) {
    const cid = e.target.value;
    setSelectedCustomerId(cid);
    fetchPurchases(cid);
  }

  function openReviewModal(productItem) {
    setActiveProduct(productItem);
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
      const res = await api.post('/reviews', {
        productId: activeProduct.productId,
        customerId: selectedCustomerId,
        rating,
        reviewText
      });

      setModalSuccess('Review submitted and analyzed with LLM!');
      setTimeout(async () => {
        setActiveProduct(null);
        await fetchPurchases(selectedCustomerId);
      }, 1500);

    } catch (err) {
      setModalError(err.response?.data?.message || 'Failed to submit review.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <LoadingSpinner message="Loading Customer Portal & Purchases..." />;

  const { customer, purchases = [] } = purchasesData || {};

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '1.5rem 1rem' }}>
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
              Customer Portal — My Purchases & Product Reviews
            </h2>
          </div>
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#94A3B8' }}>
            Submit authentic product reviews for completed purchases to trigger LLM sentiment analysis
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Customer Profile Picker */}
          {customers.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.1)', padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)' }}>
              <User size={16} color="#818CF8" />
              <span style={{ fontSize: '0.8125rem', color: '#E2E8F0', fontWeight: 500 }}>Customer:</span>
              <select
                value={selectedCustomerId}
                onChange={handleCustomerSelect}
                style={{
                  background: '#1E293B',
                  color: 'white',
                  border: '1px solid #475569',
                  borderRadius: 6,
                  padding: '4px 8px',
                  fontSize: '0.8125rem',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                {customers.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} ({c.email})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* AI Shopping Assistant Modal Trigger */}
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
        </div>
      </div>


      {error && (
        <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>
          <AlertCircle size={16} />
          <div>{error}</div>
        </div>
      )}

      {/* Customer Info Card */}
      {customer && (
        <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>Active Account</span>
              <div style={{ fontSize: '1.0625rem', fontWeight: 700, color: '#0F172A' }}>{customer.name}</div>
              <div style={{ fontSize: '0.8125rem', color: '#64748B' }}>{customer.email}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ background: '#EEF2FF', color: '#4F46E5', padding: '4px 10px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 700 }}>
                {purchases.length} Verified Purchases
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Purchased Products List */}
      <h3 style={{ margin: '0 0 1rem', fontSize: '1.0625rem', fontWeight: 700, color: '#0F172A' }}>
        Verified Purchased Products ({purchases.length})
      </h3>

      {fetchingPurchases ? (
        <LoadingSpinner message="Updating customer purchases..." />
      ) : purchases.length === 0 ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center', background: '#F8FAFC' }}>
          <Package size={40} color="#94A3B8" style={{ marginBottom: '0.75rem' }} />
          <h4 style={{ margin: '0 0 4px', fontSize: '1rem', fontWeight: 600, color: '#0F172A' }}>
            No Completed Purchases Found
          </h4>
          <p style={{ margin: 0, color: '#64748B', fontSize: '0.875rem' }}>
            This customer account does not have any completed transaction records yet.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {purchases.map((item) => (
            <div
              key={item.productId}
              className="card"
              style={{
                padding: '1.25rem',
                border: item.hasReviewed ? '1px solid #BBF7D0' : '1px solid #E2E8F0',
                background: item.hasReviewed ? '#F0FDF4' : 'white',
                borderRadius: 10,
                display: 'grid',
                gridTemplateColumns: '80px 1fr auto',
                gap: '1.25rem',
                alignItems: 'center'
              }}
            >
              {/* Product Thumbnail */}
              <div style={{
                width: 80, height: 80, borderRadius: 8, background: '#F1F5F9',
                display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'
              }}>
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.productName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <Package size={32} color="#94A3B8" />
                )}
              </div>

              {/* Product Details */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 4 }}>
                  <span style={{ background: '#E2E8F0', color: '#334155', padding: '1px 6px', borderRadius: 4, fontSize: '0.6875rem', fontWeight: 600 }}>
                    {item.category}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Store size={12} /> {item.vendorName}
                  </span>
                </div>

                <h4 style={{ margin: '0 0 6px', fontSize: '1rem', fontWeight: 700, color: '#0F172A' }}>
                  {item.productName}
                </h4>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.8125rem', color: '#64748B' }}>
                  <span style={{ fontWeight: 700, color: '#0F172A' }}>${Number(item.price).toFixed(2)}</span>
                  <span>Qty: {item.quantity}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Calendar size={12} /> {new Date(item.purchaseDate).toLocaleDateString()}
                  </span>
                </div>

                {/* Existing Review Preview if already submitted */}
                {item.hasReviewed && item.review && (
                  <div style={{ marginTop: '0.75rem', padding: '0.5rem 0.75rem', background: 'white', borderRadius: 6, border: '1px solid #DCFCE7' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 2 }}>
                      <span style={{
                        padding: '1px 6px', borderRadius: 4, fontSize: '0.6875rem', fontWeight: 700,
                        background: item.review.sentiment === 'POSITIVE' ? '#D1FAE5' : item.review.sentiment === 'NEGATIVE' ? '#FEE2E2' : '#FEF3C7',
                        color: item.review.sentiment === 'POSITIVE' ? '#059669' : item.review.sentiment === 'NEGATIVE' ? '#DC2626' : '#D97706'
                      }}>
                        {item.review.sentiment} ({item.review.sentimentScore}/100)
                      </span>
                      <span style={{ color: '#F59E0B', fontWeight: 600, fontSize: '0.75rem' }}>
                        {item.review.rating} ⭐
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.8125rem', color: '#334155', fontStyle: 'italic' }}>
                      "{item.review.summary || item.review.reviewText}"
                    </p>
                  </div>
                )}
              </div>

              {/* Action Column */}
              <div>
                {item.hasReviewed ? (
                  <span style={{
                    background: '#DCFCE7', color: '#15803D',
                    padding: '6px 12px', borderRadius: 8, fontSize: '0.8125rem', fontWeight: 700,
                    display: 'inline-flex', alignItems: 'center', gap: 4
                  }}>
                    <CheckCircle2 size={16} /> Reviewed
                  </span>
                ) : (
                  <button
                    className="btn btn-primary"
                    onClick={() => openReviewModal(item)}
                    style={{ background: '#4F46E5' }}
                  >
                    <MessageSquarePlus size={16} /> Write a Review
                  </button>
                )}
              </div>
            </div>
          ))}
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
          <div className="card" style={{ maxWidth: 520, width: '100%', padding: '1.5rem', background: 'white', borderRadius: 12 }}>
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
                {modalError}
              </div>
            )}

            {modalSuccess && (
              <div className="alert alert-success" style={{ marginBottom: '1rem' }}>
                {modalSuccess}
              </div>
            )}

            <form onSubmit={handleReviewSubmit}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Your Rating (1 to 5 Stars)</label>
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

              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label">Review Experience & Feedback</label>
                <textarea
                  className="form-input"
                  rows={4}
                  placeholder="Share details about product quality, performance, pros and cons (e.g. 'The keyboard keys are quiet and smooth, battery lasts long, but charging cable is short')..."
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setActiveProduct(null)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                  style={{ background: '#4F46E5' }}
                >
                  {submitting ? 'Analyzing with LLM...' : 'Submit & Analyze'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RAG AI Shopping Assistant Modal */}
      <AiShoppingAssistantModal
        isOpen={showAiAssistant}
        onClose={() => setShowAiAssistant(false)}
      />
    </div>
  );
}

