import { useState, useEffect, useRef, useCallback } from 'react';
import { Radio, Zap, ShoppingBag, CheckCircle, Clock, AlertCircle, RefreshCw, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/api';

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount || 0);
}

export default function RealtimeDashboardWidget() {
  const { user } = useAuth();
  const [connected, setConnected] = useState(false);
  const [events, setEvents] = useState([]);
  const [liveRevenue, setLiveRevenue] = useState(0);
  const [liveUnits, setLiveUnits] = useState(0);
  const [loading, setLoading] = useState(true);
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  const vendorId = user?.id || user?._id;

  // 1. Fetch recent transactions from MongoDB on initial mount or manual sync
  const fetchRecentTransactions = useCallback(async () => {
    if (!vendorId) return;
    try {
      setLoading(true);
      const res = await api.get(`/transactions/vendor/${vendorId}`);
      if (res.data?.success && Array.isArray(res.data.transactions)) {
        const txList = res.data.transactions;
        setEvents(txList);
        const totalRev = txList.reduce((sum, tx) => sum + (Number(tx.totalAmount) || 0), 0);
        const totalUnits = txList.reduce((sum, tx) => sum + (Number(tx.quantity) || 1), 0);
        setLiveRevenue(totalRev);
        setLiveUnits(totalUnits);
      }
    } catch (err) {
      console.warn('[RealTime] Could not fetch recent vendor transactions:', err.message);
    } finally {
      setLoading(false);
    }
  }, [vendorId]);

  useEffect(() => {
    fetchRecentTransactions();
  }, [fetchRecentTransactions]);

  // 2. Connect to FastAPI WebSocket stream for instant live sales push
  useEffect(() => {
    if (!vendorId) return;

    function connectWebSocket() {
      try {
        // Use VITE_WS_URL if set at build time (production / EC2).
        // Fall back to the browser's current hostname for local development.
        const wsBase =
          import.meta.env.VITE_WS_URL ||
          `ws://${window.location.hostname || '127.0.0.1'}:8000`;
        const wsUrl = `${wsBase}/ws/vendor/${vendorId}`;
        const ws = new WebSocket(wsUrl);
        socketRef.current = ws;

        ws.onopen = () => {
          console.log('[WebSocket] Connected to FastAPI Real-Time service for vendor:', vendorId);
          setConnected(true);
        };

        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            console.log('[WebSocket] Message received:', message);

            if (message.type === 'NEW_SALE' && message.data) {
              const newSale = message.data;
              setEvents((prev) => {
                const exists = prev.some(
                  (e) => (e.transactionId || e._id) === (newSale.transactionId || newSale._id)
                );
                if (exists) return prev;
                return [{ ...newSale, isLiveIncoming: true }, ...prev.slice(0, 24)];
              });
              setLiveRevenue((prev) => prev + (Number(newSale.totalAmount) || 0));
              setLiveUnits((prev) => prev + (Number(newSale.quantity) || 1));
            }
          } catch (e) {
            console.warn('[WebSocket] Error parsing message:', e);
          }
        };

        ws.onclose = () => {
          console.log('[WebSocket] Disconnected from FastAPI Real-Time service.');
          setConnected(false);
          // Try to reconnect in 4 seconds
          reconnectTimeoutRef.current = setTimeout(() => {
            connectWebSocket();
          }, 4000);
        };

        ws.onerror = (err) => {
          console.warn('[WebSocket] Error:', err);
          ws.close();
        };
      } catch (err) {
        console.error('[WebSocket] Connection initiation error:', err);
        setConnected(false);
      }
    }

    connectWebSocket();

    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [vendorId]);

  return (
    <div className="card" style={{ marginBottom: '1.5rem', border: connected ? '1px solid #C7D2FE' : '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
      <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <div style={{
            width: 34, height: 34, borderRadius: 8, background: '#EEF2FF',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4F46E5'
          }}>
            <Radio size={18} className={connected ? 'animate-pulse' : ''} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 6 }}>
              Live Transactions & Sales Stream
              {connected && (
                <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#10B981', background: '#ECFDF5', padding: '1px 6px', borderRadius: 4 }}>
                  LIVE
                </span>
              )}
            </h3>
            <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748B' }}>
              Instant customer purchase notifications powered by FastAPI & WebSockets
            </p>
          </div>
        </div>

        {/* Status Pill & Sync Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            onClick={fetchRecentTransactions}
            disabled={loading}
            className="btn btn-ghost btn-sm"
            style={{ padding: '4px 10px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: 4, height: 28 }}
            title="Refresh latest transactions from database"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            Sync
          </button>

          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
            padding: '4px 10px', borderRadius: 999, fontSize: '0.6875rem', fontWeight: 700,
            background: connected ? '#DCFCE7' : '#FEF2F2',
            color: connected ? '#166534' : '#991B1B',
            border: connected ? '1px solid #86EFAC' : '1px solid #FECACA'
          }}>
            <span style={{
              width: 8, height: 8, borderRadius: '50%',
              background: connected ? '#22C55E' : '#EF4444',
              display: 'inline-block'
            }} />
            {connected ? 'FastAPI Stream Active' : 'Disconnected / Reconnecting...'}
          </span>
        </div>
      </div>

      <div className="card-body">
        {/* Live Session Counter Cards */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '0.75rem', marginBottom: '1.25rem'
        }}>
          <div style={{ padding: '0.75rem 1rem', background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: '0.6875rem', color: '#64748B', fontWeight: 500 }}>Recent Sales Revenue</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#4F46E5' }}>
              {formatCurrency(liveRevenue)}
            </div>
          </div>
          <div style={{ padding: '0.75rem 1rem', background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: '0.6875rem', color: '#64748B', fontWeight: 500 }}>Total Units Sold</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#10B981' }}>
              {liveUnits}
            </div>
          </div>
          <div style={{ padding: '0.75rem 1rem', background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: '0.6875rem', color: '#64748B', fontWeight: 500 }}>Transactions Listed</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#EA580C' }}>
              {events.length}
            </div>
          </div>
        </div>

        {/* Live Feed List */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#334155' }}>
              Live Purchase Stream
            </div>
            {events.length > 0 && (
              <span style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>
                Showing last {events.length} transactions
              </span>
            )}
          </div>

          {events.length === 0 ? (
            <div style={{
              padding: '2rem 1.5rem', textAlign: 'center', background: '#F8FAFC',
              borderRadius: 8, border: '1px dashed #CBD5E1', color: '#94A3B8', fontSize: '0.8125rem'
            }}>
              <Zap size={22} style={{ margin: '0 auto 0.5rem', opacity: 0.6, color: '#6366F1' }} />
              <div style={{ fontWeight: 600, color: '#475569' }}>Listening for customer purchases...</div>
              <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: 3 }}>
                When customers purchase your products, they will immediately appear here in real-time.
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: 280, overflowY: 'auto', paddingRight: 4 }}>
              {events.map((evt, idx) => (
                <div
                  key={evt.transactionId || evt._id || idx}
                  style={{
                    padding: '0.75rem 1rem',
                    background: evt.isLiveIncoming ? '#EFF6FF' : '#F8FAFC',
                    borderRadius: 8,
                    border: evt.isLiveIncoming ? '1.5px solid #60A5FA' : '1px solid #E2E8F0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                    boxShadow: evt.isLiveIncoming ? '0 0 12px rgba(59, 130, 246, 0.15)' : 'none',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 6,
                      background: evt.isLiveIncoming ? '#2563EB' : '#4F46E5',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0
                    }}>
                      <ShoppingBag size={16} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0F172A' }}>
                          {evt.productName}
                        </span>
                        {evt.isLiveIncoming && (
                          <span style={{
                            fontSize: '0.625rem', fontWeight: 800, color: '#2563EB',
                            background: '#DBEAFE', padding: '1px 5px', borderRadius: 4, display: 'inline-flex', alignItems: 'center', gap: 2
                          }}>
                            <Sparkles size={9} /> JUST NOW
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: 2 }}>
                        Customer: <strong style={{ color: '#334155' }}>{evt.customerName || 'Customer'}</strong> • Qty: <strong>{evt.quantity}</strong> • {evt.category}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: '#059669' }}>
                      +{formatCurrency(evt.totalAmount)}
                    </div>
                    <div style={{ fontSize: '0.6875rem', color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginTop: 2 }}>
                      <Clock size={11} />
                      {evt.timestamp ? new Date(evt.timestamp).toLocaleString(undefined, {
                        hour: '2-digit', minute: '2-digit', second: '2-digit', month: 'short', day: 'numeric'
                      }) : 'Recent'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
