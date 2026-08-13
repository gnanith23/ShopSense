import { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, XCircle, RefreshCw, Link as LinkIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../api/api';

// LowStockAlert — Milestone 2 Requirement 2
// Shows low-stock and out-of-stock alerts.
// Fetches GET /api/inventory/low-stock and GET /api/inventory/out-of-stock

export default function LowStockAlert() {
  const [lowStock, setLowStock] = useState([]);
  const [outOfStock, setOutOfStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAlerts();
  }, []);

  async function fetchAlerts() {
    setLoading(true);
    setError('');
    try {
      const [lowRes, outRes] = await Promise.all([
        api.get('/inventory/low-stock'),
        api.get('/inventory/out-of-stock'),
      ]);
      setLowStock(lowRes.data.inventory || []);
      setOutOfStock(outRes.data.inventory || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load stock alerts.');
    } finally {
      setLoading(false);
    }
  }

  const totalAlerts = lowStock.length + outOfStock.length;

  if (loading) {
    return (
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748B', fontSize: '0.875rem' }}>
          <div className="spinner spinner-dark" style={{ width: 18, height: 18, borderWidth: 2 }} />
          Checking stock alerts...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-body">
          <div className="alert alert-error">
            {error}
            <button onClick={fetchAlerts} style={{ marginLeft: '0.5rem', background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626', padding: 0 }}>
              <RefreshCw size={13} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // All clear — compact success notice
  if (totalAlerts === 0) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.625rem',
        padding: '0.75rem 1rem', borderRadius: 8,
        background: '#F0FDF4', border: '1px solid #BBF7D0',
        marginBottom: '1.5rem', fontSize: '0.875rem', color: '#059669',
      }}>
        <CheckCircle size={16} />
        <span><strong>All clear:</strong> All products have healthy stock levels.</span>
      </div>
    );
  }

  return (
    <div className="card" style={{ marginBottom: '1.5rem' }}>
      {/* Header */}
      <div className="card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertTriangle size={16} color="#EA580C" />
          <div>
            <h3 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 600, color: '#0F172A' }}>
              Stock Alerts
            </h3>
            <p style={{ margin: '1px 0 0', fontSize: '0.8125rem', color: '#64748B' }}>
              {totalAlerts} product{totalAlerts !== 1 ? 's' : ''} need attention
            </p>
          </div>
        </div>
        <button
          onClick={fetchAlerts}
          style={{ background: 'none', border: '1px solid #E2E8F0', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', color: '#64748B', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem' }}
          title="Refresh alerts"
        >
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      <div className="card-body" style={{ paddingTop: '1rem' }}>
        {/* Out of Stock section */}
        {outOfStock.length > 0 && (
          <div style={{ marginBottom: lowStock.length > 0 ? '1rem' : 0 }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#DC2626', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <XCircle size={12} /> Out of Stock ({outOfStock.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              {outOfStock.map((p) => (
                <div
                  key={p.productId}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0.625rem 0.875rem', borderRadius: 8,
                    background: '#FFF1F2', border: '1px solid #FECDD3',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <XCircle size={14} color="#DC2626" />
                    <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#0F172A' }}>{p.name}</span>
                    <span style={{ fontSize: '0.75rem', color: '#94A3B8', background: '#F1F5F9', padding: '1px 6px', borderRadius: 4 }}>{p.category}</span>
                  </div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#DC2626' }}>0 units</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Low Stock section */}
        {lowStock.length > 0 && (
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#EA580C', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <AlertTriangle size={12} /> Low Stock ({lowStock.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              {lowStock.map((p) => (
                <div
                  key={p.productId}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0.625rem 0.875rem', borderRadius: 8,
                    background: '#FFFBEB', border: '1px solid #FDE68A',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertTriangle size={14} color="#D97706" />
                    <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#0F172A' }}>{p.name}</span>
                    <span style={{ fontSize: '0.75rem', color: '#94A3B8', background: '#F1F5F9', padding: '1px 6px', borderRadius: 4 }}>{p.category}</span>
                  </div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#D97706' }}>
                    {p.stock} unit{p.stock !== 1 ? 's' : ''} left
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer link */}
        <div style={{ marginTop: '0.875rem', paddingTop: '0.875rem', borderTop: '1px solid #F1F5F9' }}>
          <Link
            to="/vendor/catalog"
            style={{ fontSize: '0.8125rem', color: '#4F46E5', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: '0.25rem', textDecoration: 'none' }}
          >
            View full catalog to restock →
          </Link>
        </div>
      </div>
    </div>
  );
}
