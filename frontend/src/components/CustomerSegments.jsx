import { useState, useEffect } from 'react';
import { Users, Crown, Star, TrendingUp, User, RefreshCw, Info } from 'lucide-react';
import api from '../api/api';

// CustomerSegments — Milestone 2 Requirement 2
// Fetches GET /api/analytics/customer-segments
// Displays summary cards + customer table with spending tiers.
// All values come from backend — no hardcoded data.

function formatINR(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

const SEGMENT_CONFIG = {
  VIP: {
    label: 'VIP',
    color: '#7C3AED',
    bg: '#EDE9FE',
    border: '#C4B5FD',
    icon: Crown,
    dot: '#7C3AED',
  },
  HIGH_VALUE: {
    label: 'High Value',
    color: '#0284C7',
    bg: '#E0F2FE',
    border: '#BAE6FD',
    icon: Star,
    dot: '#0284C7',
  },
  REGULAR: {
    label: 'Regular',
    color: '#059669',
    bg: '#D1FAE5',
    border: '#6EE7B7',
    icon: TrendingUp,
    dot: '#059669',
  },
  LOW_VALUE: {
    label: 'Low Value',
    color: '#64748B',
    bg: '#F1F5F9',
    border: '#CBD5E1',
    icon: User,
    dot: '#94A3B8',
  },
};

function SegmentBadge({ segment }) {
  const cfg = SEGMENT_CONFIG[segment] || SEGMENT_CONFIG.LOW_VALUE;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
      background: cfg.bg, color: cfg.color,
      border: `1px solid ${cfg.border}`,
      padding: '2px 8px', borderRadius: 20,
      fontSize: '0.73rem', fontWeight: 600,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.dot, display: 'inline-block' }} />
      {cfg.label}
    </span>
  );
}

export default function CustomerSegments() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSegments();
  }, []);

  async function fetchSegments() {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/analytics/customer-segments');
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load customer analytics.');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748B', fontSize: '0.875rem' }}>
          <div className="spinner spinner-dark" style={{ width: 18, height: 18, borderWidth: 2 }} />
          Loading customer segments...
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
            <button onClick={fetchSegments} style={{ marginLeft: '0.5rem', background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626', padding: 0 }}>
              <RefreshCw size={13} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isInsufficient = data?.dataStatus === 'INSUFFICIENT_DATA';
  const summary = data?.summary;
  const segments = data?.segments || [];
  const thresholds = data?.segmentThresholds;

  return (
    <div className="card" style={{ marginBottom: '1.5rem' }}>
      {/* Card header */}
      <div className="card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Users size={16} color="#4F46E5" />
          <div>
            <h3 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 600, color: '#0F172A' }}>
              Customer Segmentation
            </h3>
            <p style={{ margin: '1px 0 0', fontSize: '0.8125rem', color: '#64748B' }}>
              Customers grouped by total spending from completed transactions
            </p>
          </div>
        </div>
        <button
          onClick={fetchSegments}
          style={{ background: 'none', border: '1px solid #E2E8F0', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', color: '#64748B', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem' }}
        >
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      <div className="card-body">
        {/* Threshold legend */}
        {thresholds && (
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: '0.5rem',
            marginBottom: '1.25rem', padding: '0.75rem', borderRadius: 8,
            background: '#F8FAFC', border: '1px solid #E2E8F0',
          }}>
            <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 500, marginRight: '0.25rem', alignSelf: 'center' }}>
              Thresholds:
            </span>
            {Object.entries(thresholds).map(([seg, label]) => {
              const cfg = SEGMENT_CONFIG[seg] || SEGMENT_CONFIG.LOW_VALUE;
              return (
                <span key={seg} style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                  background: cfg.bg, color: cfg.color,
                  border: `1px solid ${cfg.border}`,
                  padding: '2px 8px', borderRadius: 20,
                  fontSize: '0.7rem', fontWeight: 600,
                }}>
                  {cfg.label}: {label}
                </span>
              );
            })}
          </div>
        )}

        {/* Insufficient data state */}
        {isInsufficient ? (
          <div className="alert alert-info" style={{ alignItems: 'flex-start' }}>
            <Info size={16} style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <strong>No transaction data yet</strong>
              <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: '#1E40AF' }}>
                Customer segments will appear here once your vendor account has completed transactions.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* 4 segment summary cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: '0.75rem',
              marginBottom: '1.5rem',
            }}>
              {[
                { key: 'VIP', count: summary?.vipCount ?? 0 },
                { key: 'HIGH_VALUE', count: summary?.highValueCount ?? 0 },
                { key: 'REGULAR', count: summary?.regularCount ?? 0 },
                { key: 'LOW_VALUE', count: summary?.lowValueCount ?? 0 },
              ].map(({ key, count }) => {
                const cfg = SEGMENT_CONFIG[key];
                const Icon = cfg.icon;
                return (
                  <div key={key} style={{
                    background: cfg.bg, border: `1px solid ${cfg.border}`,
                    borderRadius: 10, padding: '0.875rem',
                    display: 'flex', flexDirection: 'column', gap: '0.375rem',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      <Icon size={14} color={cfg.color} />
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: cfg.color }}>
                        {cfg.label}
                      </span>
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: cfg.color, lineHeight: 1 }}>
                      {count}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: cfg.color + 'AA', fontWeight: 500 }}>
                      {count === 1 ? 'customer' : 'customers'}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Customer table */}
            {segments.length > 0 ? (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Customer</th>
                      <th>Email</th>
                      <th>Total Spent</th>
                      <th>Transactions</th>
                      <th>Segment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {segments.map((c) => (
                      <tr key={c.customerId}>
                        <td style={{ fontWeight: 500, color: '#0F172A' }}>{c.name || '—'}</td>
                        <td style={{ color: '#64748B', fontSize: '0.8125rem' }}>{c.email || '—'}</td>
                        <td style={{ fontWeight: 600, color: '#0F172A' }}>{formatINR(c.totalSpent)}</td>
                        <td style={{ color: '#475569' }}>{c.transactionCount}</td>
                        <td><SegmentBadge segment={c.segment} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p style={{ fontSize: '0.875rem', color: '#94A3B8', textAlign: 'center', padding: '1rem 0' }}>
                No customer data available yet.
              </p>
            )}

            {/* Footer total */}
            {summary && (
              <p style={{ margin: '0.875rem 0 0', fontSize: '0.8125rem', color: '#64748B', borderTop: '1px solid #F1F5F9', paddingTop: '0.875rem' }}>
                Total: <strong>{summary.totalCustomers}</strong> unique customer{summary.totalCustomers !== 1 ? 's' : ''} ·
                Total revenue from segments: <strong>{formatINR(summary.totalRevenueFromSegments)}</strong>
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
