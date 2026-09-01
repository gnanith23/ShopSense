import { useState, useEffect, useRef } from 'react';
import { Radio, Zap, ShoppingBag, CheckCircle, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

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
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  const vendorId = user?.id || user?._id;

  useEffect(() => {
    if (!vendorId) return;

    function connectWebSocket() {
      try {
        const wsUrl = `ws://127.0.0.1:8000/ws/vendor/${vendorId}`;
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
              setEvents((prev) => [newSale, ...prev.slice(0, 19)]); // Keep last 20
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
    <div className="card" style={{ marginBottom: '1.5rem', border: connected ? '1px solid #C7D2FE' : '1px solid #E2E8F0' }}>
      <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8, background: '#EEF2FF',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4F46E5'
          }}>
            <Radio size={18} className={connected ? 'animate-pulse' : ''} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#0F172A' }}>
              Real-Time Sales Dashboard
            </h3>
            <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748B' }}>
              Instant transaction stream powered by FastAPI & WebSockets
            </p>
          </div>
        </div>

        {/* Live Status Pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
            padding: '3px 10px', borderRadius: 999, fontSize: '0.6875rem', fontWeight: 700,
            background: connected ? '#DCFCE7' : '#FEF2F2',
            color: connected ? '#166534' : '#991B1B',
            border: connected ? '1px solid #86EFAC' : '1px solid #FECACA'
          }}>
            <span style={{
              width: 8, height: 8, borderRadius: '50%',
              background: connected ? '#22C55E' : '#EF4444',
              display: 'inline-block'
            }} />
            {connected ? 'FastAPI WebSocket Live' : 'Disconnected / Reconnecting...'}
          </span>
        </div>
      </div>

      <div className="card-body">
        {/* Live Session Counter Cards */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '0.75rem', marginBottom: '1rem'
        }}>
          <div style={{ padding: '0.75rem 1rem', background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: '0.6875rem', color: '#64748B', fontWeight: 500 }}>Live Session Revenue</div>
            <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#4F46E5' }}>
              {formatCurrency(liveRevenue)}
            </div>
          </div>
          <div style={{ padding: '0.75rem 1rem', background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: '0.6875rem', color: '#64748B', fontWeight: 500 }}>Live Units Sold</div>
            <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#10B981' }}>
              {liveUnits}
            </div>
          </div>
          <div style={{ padding: '0.75rem 1rem', background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: '0.6875rem', color: '#64748B', fontWeight: 500 }}>Live Events Received</div>
            <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#EA580C' }}>
              {events.length}
            </div>
          </div>
        </div>

        {/* Live Feed List */}
        <div>
          <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.5rem' }}>
            Live Sale Notifications Feed
          </div>

          {events.length === 0 ? (
            <div style={{
              padding: '1.5rem', textAlign: 'center', background: '#F8FAFC',
              borderRadius: 8, border: '1px dashed #CBD5E1', color: '#94A3B8', fontSize: '0.8125rem'
            }}>
              <Zap size={20} style={{ margin: '0 auto 0.5rem', opacity: 0.6 }} />
              <div>Listening for incoming sales...</div>
              <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: 2 }}>
                When customers complete a purchase, it will appear here instantly without refreshing the browser.
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: 220, overflowY: 'auto' }}>
              {events.map((evt, idx) => (
                <div
                  key={evt.transactionId || idx}
                  style={{
                    padding: '0.75rem 1rem', background: '#EEF2FF', borderRadius: 8,
                    border: '1px solid #C7D2FE', display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem',
                    animation: 'fadeIn 0.3s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 6, background: '#4F46E5',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white'
                    }}>
                      <ShoppingBag size={14} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#1E1B4B' }}>
                        {evt.productName}
                      </div>
                      <div style={{ fontSize: '0.6875rem', color: '#4338CA' }}>
                        Qty: {evt.quantity} • Customer: {evt.customerName || 'Customer'} • {evt.category}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#059669' }}>
                      +{formatCurrency(evt.totalAmount)}
                    </div>
                    <div style={{ fontSize: '0.6875rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Clock size={10} />
                      {evt.timestamp ? new Date(evt.timestamp).toLocaleTimeString() : 'Just now'}
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
