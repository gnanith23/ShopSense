import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  Package,
  Store,
  ShoppingCart,
  X,
  CheckCircle,
  AlertCircle,
  Tag,
  Minus,
  Plus,
  BadgeDollarSign,
  TrendingUp,
  Sparkles,
  Box,
  ExternalLink,
  Loader2,
  Bot
} from 'lucide-react';
import api from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import AiShoppingAssistantModal from '../../components/AiShoppingAssistantModal';

export default function CustomerMarketplace() {
  const { user } = useAuth();

  // Marketplace data state
  const [comparableGroups, setComparableGroups] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Search & filter state
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [sortBy, setSortBy] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');

  // Checkout modal state
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [purchasing, setPurchasing] = useState(false);
  const [purchaseError, setPurchaseError] = useState('');
  const [purchaseSuccess, setPurchaseSuccess] = useState(null);

  // RAG AI Shopping Assistant modal state
  const [showRagModal, setShowRagModal] = useState(false);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setSearchDebounced(search), 350);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch marketplace products
  const fetchMarketplace = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (searchDebounced.trim()) params.search = searchDebounced.trim();
      if (category && category !== 'All') params.category = category;
      if (sortBy) params.sortBy = sortBy;

      const res = await api.get('/products/marketplace', { params });
      setComparableGroups(res.data.comparableGroups || []);
      setCategories(res.data.categories || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load marketplace products.');
    } finally {
      setLoading(false);
    }
  }, [searchDebounced, category, sortBy]);

  useEffect(() => {
    fetchMarketplace();
  }, [fetchMarketplace]);

  // Open checkout modal for a specific vendor offer
  function openCheckout(offer) {
    setSelectedOffer(offer);
    setQuantity(1);
    setPurchaseError('');
    setPurchaseSuccess(null);
  }

  function closeCheckout() {
    setSelectedOffer(null);
    setPurchaseError('');
    setPurchaseSuccess(null);
  }

  // Handle simulated purchase
  async function handlePurchase() {
    if (!selectedOffer || !user) return;

    setPurchasing(true);
    setPurchaseError('');
    setPurchaseSuccess(null);

    try {
      const customerId = user?.id || user?._id;
      const res = await api.post('/transactions', {
        productId: selectedOffer.productId,
        vendorId: selectedOffer.vendorId,
        quantity: quantity,
        customerId: customerId
      });

      setPurchaseSuccess(res.data.transaction);

      // Refresh marketplace to update stock
      setTimeout(() => fetchMarketplace(), 1000);
    } catch (err) {
      setPurchaseError(
        err.response?.data?.message || 'Purchase failed. Please try again.'
      );
    } finally {
      setPurchasing(false);
    }
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0.5rem 0.5rem' }}>
      {/* Marketplace Header */}
      <div style={{
        background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 60%, #312E81 100%)',
        borderRadius: 14,
        padding: '1.75rem 1.5rem',
        color: 'white',
        marginBottom: '1.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 6 }}>
          <Store size={22} color="#818CF8" />
          <h1 style={{ margin: 0, fontSize: '1.375rem', fontWeight: 800, color: 'white', letterSpacing: '-0.02em' }}>
            ShopSense Marketplace
          </h1>
        </div>
        <p style={{ margin: 0, fontSize: '0.875rem', color: '#94A3B8', maxWidth: 600 }}>
          Browse products from verified vendors. Compare offers across multiple sellers and get the best price. 
          Every purchase triggers real-time vendor notifications.
        </p>
      </div>

      {/* Search & Filters Row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        marginBottom: '1.5rem',
        flexWrap: 'wrap'
      }}>
        {/* Search bar */}
        <div style={{
          flex: '1 1 300px',
          position: 'relative'
        }}>
          <Search size={16} style={{
            position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
            color: '#94A3B8', pointerEvents: 'none'
          }} />
          <input
            type="text"
            placeholder="Search products (e.g. Gaming Mouse, HEAD SETS, polo shirt)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '0.625rem 0.75rem 0.625rem 2.25rem',
              border: '1px solid #CBD5E1',
              borderRadius: 8,
              fontSize: '0.875rem',
              background: 'white',
              outline: 'none',
              transition: 'border-color 0.15s',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Category filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <Filter size={14} color="#64748B" />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={{
              padding: '0.5rem 0.75rem',
              border: '1px solid #CBD5E1',
              borderRadius: 8,
              fontSize: '0.8125rem',
              background: 'white',
              cursor: 'pointer',
              outline: 'none',
              fontWeight: 500
            }}
          >
            <option value="All">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Sort by */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <ArrowUpDown size={14} color="#64748B" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              padding: '0.5rem 0.75rem',
              border: '1px solid #CBD5E1',
              borderRadius: 8,
              fontSize: '0.8125rem',
              background: 'white',
              cursor: 'pointer',
              outline: 'none',
              fontWeight: 500
            }}
          >
            <option value="">Newest First</option>
            <option value="price_asc">Price: Low → High</option>
            <option value="price_desc">Price: High → Low</option>
            <option value="name_asc">Name: A → Z</option>
          </select>
        </div>

        {/* AI Shopping Assistant Button */}
        <button
          onClick={() => setShowRagModal(true)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.375rem',
            padding: '0.5rem 1rem',
            background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            fontSize: '0.8125rem',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(79, 70, 229, 0.35)',
            whiteSpace: 'nowrap',
            flexShrink: 0
          }}
        >
          <Bot size={15} />
          AI Assistant
        </button>
      </div>

      {/* Error State */}
      {error && (
        <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '4rem 1rem', color: '#64748B'
        }}>
          <Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} color="#4F46E5" />
          <p style={{ marginTop: '0.75rem', fontSize: '0.875rem' }}>Loading marketplace products...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : comparableGroups.length === 0 ? (
        /* Empty State */
        <div style={{
          textAlign: 'center', padding: '4rem 1rem', background: '#F8FAFC',
          borderRadius: 12, border: '1px solid #E2E8F0'
        }}>
          <Package size={48} color="#94A3B8" />
          <h3 style={{ margin: '0.75rem 0 0.5rem', fontSize: '1.125rem', fontWeight: 700, color: '#0F172A' }}>
            No products found
          </h3>
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748B', maxWidth: 400, marginInline: 'auto' }}>
            {search ? `No products matching "${search}". Try adjusting your search terms.` : 'No products are available in the marketplace right now. Products appear here once registered vendors add them.'}
          </p>
        </div>
      ) : (
        /* Product Groups Grid */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Results summary */}
          <div style={{ fontSize: '0.8125rem', color: '#64748B', fontWeight: 500 }}>
            Showing {comparableGroups.length} product{comparableGroups.length !== 1 ? 's' : ''} with {comparableGroups.reduce((sum, g) => sum + g.offerCount, 0)} total vendor offers
          </div>

          {comparableGroups.map((group) => (
            <div
              key={group.groupKey}
              style={{
                background: 'white',
                borderRadius: 12,
                border: '1px solid #E2E8F0',
                overflow: 'hidden',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
              }}
            >
              {/* Product Header Row */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '80px 1fr auto',
                gap: '1rem',
                padding: '1.25rem',
                alignItems: 'center',
                borderBottom: '1px solid #F1F5F9'
              }}>
                {/* Thumbnail */}
                <div style={{
                  width: 80, height: 80, borderRadius: 8, background: '#F1F5F9',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'
                }}>
                  {group.imageUrl ? (
                    <img src={group.imageUrl} alt={group.productName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <Package size={28} color="#94A3B8" />
                  )}
                </div>

                {/* Product details */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: 4 }}>
                    <span style={{
                      background: '#EEF2FF', color: '#4338CA', padding: '2px 8px',
                      borderRadius: 4, fontSize: '0.6875rem', fontWeight: 700
                    }}>
                      {group.category}
                    </span>
                    {group.offerCount > 1 && (
                      <span style={{
                        background: '#FEF3C7', color: '#92400E', padding: '2px 8px',
                        borderRadius: 4, fontSize: '0.6875rem', fontWeight: 700
                      }}>
                        {group.offerCount} VENDOR OFFERS — COMPARE!
                      </span>
                    )}
                  </div>
                  <h3 style={{ margin: '0 0 4px', fontSize: '1.0625rem', fontWeight: 700, color: '#0F172A' }}>
                    {group.productName}
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.8125rem', color: '#64748B', lineHeight: 1.4, maxWidth: 500 }}>
                    {group.description?.length > 120 ? group.description.slice(0, 120) + '...' : group.description}
                  </p>
                </div>

                {/* Price range badge */}
                <div style={{ textAlign: 'right', minWidth: 100 }}>
                  <div style={{ fontSize: '0.6875rem', color: '#64748B', fontWeight: 600 }}>
                    {group.minPrice === group.maxPrice ? 'PRICE' : 'PRICE RANGE'}
                  </div>
                  <div style={{ fontSize: '1.125rem', fontWeight: 800, color: '#0F172A' }}>
                    ${Number(group.minPrice).toFixed(2)}
                    {group.minPrice !== group.maxPrice && (
                      <span style={{ fontSize: '0.875rem', color: '#64748B', fontWeight: 500 }}>
                        {' — $'}{Number(group.maxPrice).toFixed(2)}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                    {group.totalStock} units in stock
                  </div>
                </div>
              </div>

              {/* Vendor Offer Rows */}
              <div style={{ background: '#FAFBFC' }}>
                {/* Offer table header */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 110px 80px 120px',
                  gap: '0.5rem',
                  padding: '0.5rem 1.25rem',
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  color: '#64748B',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  borderBottom: '1px solid #F1F5F9'
                }}>
                  <span>Vendor</span>
                  <span style={{ textAlign: 'right' }}>Price</span>
                  <span style={{ textAlign: 'center' }}>Stock</span>
                  <span style={{ textAlign: 'center' }}>Action</span>
                </div>

                {group.offers.map((offer, idx) => (
                  <div
                    key={offer.productId}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 110px 80px 120px',
                      gap: '0.5rem',
                      padding: '0.75rem 1.25rem',
                      alignItems: 'center',
                      borderBottom: idx < group.offers.length - 1 ? '1px solid #F1F5F9' : 'none',
                      background: offer.isBestOffer ? '#F0FDF4' : 'transparent',
                      transition: 'background 0.15s'
                    }}
                  >
                    {/* Vendor info */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{
                        width: 30, height: 30, borderRadius: '50%',
                        background: offer.isBestOffer ? '#10B981' : '#4F46E5', color: 'white',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.6875rem', fontWeight: 700, flexShrink: 0
                      }}>
                        {offer.vendorName?.charAt(0)?.toUpperCase() || 'V'}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.8125rem', color: '#0F172A' }}>
                          {offer.vendorName}
                        </div>
                        {offer.vendorAddress && (
                          <div style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>
                            {offer.vendorAddress}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Price */}
                    <div style={{ textAlign: 'right' }}>
                      <span style={{
                        fontSize: '0.9375rem', fontWeight: 700,
                        color: offer.isBestOffer ? '#059669' : '#0F172A'
                      }}>
                        ${Number(offer.price).toFixed(2)}
                      </span>
                      {offer.isBestOffer && group.offerCount > 1 && (
                        <div style={{
                          display: 'inline-flex', alignItems: 'center', gap: 2,
                          background: '#DCFCE7', color: '#15803D',
                          padding: '1px 5px', borderRadius: 4,
                          fontSize: '0.5625rem', fontWeight: 700,
                          marginLeft: 4
                        }}>
                          BEST
                        </div>
                      )}
                    </div>

                    {/* Stock */}
                    <div style={{ textAlign: 'center' }}>
                      {offer.inStock ? (
                        <span style={{
                          background: '#DCFCE7', color: '#15803D',
                          padding: '2px 6px', borderRadius: 4,
                          fontSize: '0.6875rem', fontWeight: 600
                        }}>
                          {offer.stock} left
                        </span>
                      ) : (
                        <span style={{
                          background: '#FEE2E2', color: '#DC2626',
                          padding: '2px 6px', borderRadius: 4,
                          fontSize: '0.6875rem', fontWeight: 600
                        }}>
                          Sold out
                        </span>
                      )}
                    </div>

                    {/* Action */}
                    <div style={{ textAlign: 'center' }}>
                      <button
                        onClick={() => openCheckout(offer)}
                        disabled={!offer.inStock}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                          padding: '0.375rem 0.75rem',
                          background: offer.inStock ? '#4F46E5' : '#CBD5E1',
                          color: 'white',
                          border: 'none',
                          borderRadius: 6,
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: offer.inStock ? 'pointer' : 'not-allowed',
                          transition: 'background 0.15s'
                        }}
                      >
                        <ShoppingCart size={12} />
                        {offer.inStock ? 'Buy' : 'Unavailable'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ============ CHECKOUT MODAL ============ */}
      {selectedOffer && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '1rem'
        }}>
          <div style={{
            maxWidth: 480, width: '100%', background: 'white',
            borderRadius: 14, overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
          }}>
            {/* Modal Header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '1rem 1.25rem',
              borderBottom: '1px solid #E2E8F0',
              background: '#F8FAFC'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShoppingCart size={18} color="#4F46E5" />
                <h3 style={{ margin: 0, fontSize: '1.0625rem', fontWeight: 700, color: '#0F172A' }}>
                  {purchaseSuccess ? 'Purchase Complete!' : 'Confirm Purchase'}
                </h3>
              </div>
              <button
                onClick={closeCheckout}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: 4, borderRadius: 6, color: '#64748B'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '1.25rem' }}>
              {purchaseSuccess ? (
                /* ====== SUCCESS VIEW ====== */
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    width: 56, height: 56, borderRadius: '50%',
                    background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 1rem'
                  }}>
                    <CheckCircle size={28} color="#16A34A" />
                  </div>
                  <h4 style={{ margin: '0 0 0.5rem', fontSize: '1.125rem', fontWeight: 700, color: '#0F172A' }}>
                    Order Confirmed!
                  </h4>
                  <p style={{ margin: '0 0 1.25rem', fontSize: '0.8125rem', color: '#64748B', lineHeight: 1.5 }}>
                    Your purchase has been completed and the vendor has been notified in real-time.
                  </p>

                  {/* Order Summary Table */}
                  <div style={{
                    background: '#F8FAFC', borderRadius: 8, padding: '1rem',
                    textAlign: 'left', border: '1px solid #E2E8F0', marginBottom: '1.25rem'
                  }}>
                    <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
                      ORDER SUMMARY
                    </div>
                    {[
                      ['Product', purchaseSuccess.productName],
                      ['Vendor', purchaseSuccess.vendorName],
                      ['Quantity', purchaseSuccess.quantity],
                      ['Unit Price', `$${Number(purchaseSuccess.unitPrice).toFixed(2)}`],
                      ['Total Amount', `$${Number(purchaseSuccess.totalAmount).toFixed(2)}`],
                      ['Stock Remaining', purchaseSuccess.updatedStock !== undefined ? purchaseSuccess.updatedStock : '—'],
                      ['Status', purchaseSuccess.status],
                      ['Order ID', purchaseSuccess._id || purchaseSuccess.id]
                    ].map(([label, val]) => (
                      <div key={label} style={{
                        display: 'flex', justifyContent: 'space-between',
                        fontSize: '0.8125rem', padding: '3px 0',
                        borderBottom: '1px solid #F1F5F9'
                      }}>
                        <span style={{ color: '#64748B' }}>{label}</span>
                        <span style={{
                          fontWeight: label === 'Total Amount' || label === 'Status' ? 700 : 500,
                          color: label === 'Status' ? '#16A34A' : '#0F172A',
                          fontFamily: label === 'Order ID' ? 'monospace' : 'inherit',
                          fontSize: label === 'Order ID' ? '0.6875rem' : 'inherit'
                        }}>{val}</span>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                    <a
                      href="/customer/purchases"
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                        padding: '0.5rem 1rem',
                        background: '#4F46E5', color: 'white',
                        borderRadius: 8, fontSize: '0.8125rem', fontWeight: 600,
                        textDecoration: 'none'
                      }}
                    >
                      <ExternalLink size={14} />
                      View My Purchases
                    </a>
                    <button
                      onClick={closeCheckout}
                      style={{
                        padding: '0.5rem 1rem',
                        background: '#F1F5F9', color: '#334155',
                        border: '1px solid #CBD5E1',
                        borderRadius: 8, fontSize: '0.8125rem', fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      Continue Shopping
                    </button>
                  </div>
                </div>
              ) : (
                /* ====== CHECKOUT FORM ====== */
                <div>
                  {/* Error */}
                  {purchaseError && (
                    <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
                      <AlertCircle size={14} />
                      <span>{purchaseError}</span>
                    </div>
                  )}

                  {/* Product info */}
                  <div style={{
                    display: 'flex', gap: '0.75rem', marginBottom: '1.25rem',
                    padding: '0.75rem', background: '#F8FAFC', borderRadius: 8,
                    border: '1px solid #E2E8F0'
                  }}>
                    <div style={{
                      width: 56, height: 56, borderRadius: 8, background: '#F1F5F9',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {selectedOffer.imageUrl ? (
                        <img src={selectedOffer.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} />
                      ) : (
                        <Package size={24} color="#94A3B8" />
                      )}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#0F172A' }}>
                        {selectedOffer.productName}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Store size={11} /> {selectedOffer.vendorName}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                        {selectedOffer.category} • {selectedOffer.stock} in stock
                      </div>
                    </div>
                  </div>

                  {/* Quantity selector */}
                  <div style={{ marginBottom: '1.25rem' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#334155', marginBottom: 6, display: 'block' }}>
                      Quantity
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <button
                        type="button"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        disabled={quantity <= 1}
                        style={{
                          width: 36, height: 36, borderRadius: 8,
                          border: '1px solid #CBD5E1', background: '#F8FAFC',
                          cursor: quantity > 1 ? 'pointer' : 'not-allowed',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#334155'
                        }}
                      >
                        <Minus size={14} />
                      </button>
                      <input
                        type="number"
                        min={1}
                        max={selectedOffer.stock}
                        value={quantity}
                        onChange={(e) => {
                          const val = Math.max(1, Math.min(selectedOffer.stock, parseInt(e.target.value) || 1));
                          setQuantity(val);
                        }}
                        style={{
                          width: 60, textAlign: 'center',
                          padding: '0.375rem', border: '1px solid #CBD5E1',
                          borderRadius: 8, fontSize: '0.9375rem', fontWeight: 700,
                          outline: 'none'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setQuantity(Math.min(selectedOffer.stock, quantity + 1))}
                        disabled={quantity >= selectedOffer.stock}
                        style={{
                          width: 36, height: 36, borderRadius: 8,
                          border: '1px solid #CBD5E1', background: '#F8FAFC',
                          cursor: quantity < selectedOffer.stock ? 'pointer' : 'not-allowed',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#334155'
                        }}
                      >
                        <Plus size={14} />
                      </button>
                      <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                        max {selectedOffer.stock}
                      </span>
                    </div>
                  </div>

                  {/* Price breakdown */}
                  <div style={{
                    background: '#F8FAFC', borderRadius: 8, padding: '0.875rem',
                    border: '1px solid #E2E8F0', marginBottom: '1.25rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: '0.8125rem', color: '#64748B' }}>
                      <span>Unit Price</span>
                      <span style={{ fontWeight: 600, color: '#0F172A' }}>${Number(selectedOffer.price).toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: '0.8125rem', color: '#64748B' }}>
                      <span>Quantity</span>
                      <span style={{ fontWeight: 600, color: '#0F172A' }}>× {quantity}</span>
                    </div>
                    <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: 8, marginTop: 4 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem' }}>
                        <span style={{ fontWeight: 700, color: '#0F172A' }}>Total</span>
                        <span style={{ fontWeight: 800, color: '#4F46E5', fontSize: '1.125rem' }}>
                          ${(selectedOffer.price * quantity).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Demo notice */}
                  <div style={{
                    background: '#FFFBEB', border: '1px solid #FDE68A',
                    borderRadius: 8, padding: '0.5rem 0.75rem',
                    fontSize: '0.6875rem', color: '#92400E',
                    marginBottom: '1rem',
                    display: 'flex', alignItems: 'center', gap: '0.375rem'
                  }}>
                    <Sparkles size={12} />
                    <span>This is a <strong>simulated/demo</strong> purchase. No real payment is processed. Stock is decremented and a real-time sale event is broadcast to the vendor's dashboard.</span>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                    <button
                      onClick={closeCheckout}
                      disabled={purchasing}
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
                      onClick={handlePurchase}
                      disabled={purchasing}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                        padding: '0.5rem 1.25rem',
                        background: purchasing ? '#94A3B8' : '#4F46E5',
                        color: 'white', border: 'none',
                        borderRadius: 8, fontSize: '0.8125rem', fontWeight: 700,
                        cursor: purchasing ? 'not-allowed' : 'pointer',
                        boxShadow: purchasing ? 'none' : '0 4px 12px rgba(79, 70, 229, 0.25)'
                      }}
                    >
                      {purchasing ? (
                        <>
                          <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CheckCircle size={14} />
                          Complete Purchase
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* RAG AI Shopping Assistant Modal */}
      <AiShoppingAssistantModal
        isOpen={showRagModal}
        onClose={() => setShowRagModal(false)}
      />

      {/* Floating AI Assistant FAB — always visible */}
      <button
        onClick={() => setShowRagModal(true)}
        title="Ask the RAG AI Shopping Assistant"
        style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          zIndex: 1000,
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
          color: 'white',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 25px rgba(79, 70, 229, 0.5)',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)';
          e.currentTarget.style.boxShadow = '0 12px 30px rgba(79, 70, 229, 0.65)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 8px 25px rgba(79, 70, 229, 0.5)';
        }}
      >
        <Bot size={26} />
      </button>
    </div>
  );
}
