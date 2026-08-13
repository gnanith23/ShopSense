import { useState, useEffect } from 'react';
import { TrendingUp, DollarSign, ShoppingCart, Info } from 'lucide-react';
import api from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import StatCard from '../../components/StatCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import CustomerSegments from '../../components/CustomerSegments';
import RecommendationWidget from '../../components/RecommendationWidget';
import AnalyticsValidation from '../../components/AnalyticsValidation';

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', minimumFractionDigits: 2,
  }).format(amount || 0);
}

export default function VendorAnalytics() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user?.id) return;
    fetchAnalytics();
  }, [user]);

  async function fetchAnalytics() {
    try {
      // GET /api/vendors/:id/analytics
      const res = await api.get(`/vendors/${user.id}/analytics`);
      setAnalytics(res.data.analytics);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load analytics.');
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <LoadingSpinner message="Loading analytics..." />;

  if (error) {
    return (
      <div className="alert alert-error" style={{ maxWidth: 500 }}>
        {error}
      </div>
    );
  }

  const hasData =
    analytics &&
    (analytics.totalSales > 0 ||
      analytics.totalRevenue > 0 ||
      analytics.totalTransactions > 0);

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 className="page-title">Analytics</h2>
        <p className="page-subtitle">Performance summary for {user?.businessName}</p>
      </div>

      {/* Stat cards */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <StatCard
          label="Total Units Sold"
          value={analytics?.totalSales ?? 0}
          icon={TrendingUp}
          iconBg="#EEF2FF"
          iconColor="#4F46E5"
        />
        <StatCard
          label="Total Revenue"
          value={formatCurrency(analytics?.totalRevenue)}
          icon={DollarSign}
          iconBg="#F0FDF4"
          iconColor="#059669"
        />
        <StatCard
          label="Total Transactions"
          value={analytics?.totalTransactions ?? 0}
          icon={ShoppingCart}
          iconBg="#FFF7ED"
          iconColor="#EA580C"
        />
      </div>

      {/* Average revenue per transaction */}
      {hasData && analytics.totalTransactions > 0 && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <div className="card-body">
            <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.9375rem', fontWeight: 600, color: '#0F172A' }}>
              Performance Snapshot
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
              <div style={{
                padding: '1rem', background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0'
              }}>
                <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 500, marginBottom: 4 }}>
                  Avg. Revenue / Transaction
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0F172A' }}>
                  {formatCurrency(analytics.totalRevenue / analytics.totalTransactions)}
                </div>
              </div>
              <div style={{
                padding: '1rem', background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0'
              }}>
                <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 500, marginBottom: 4 }}>
                  Avg. Units / Transaction
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0F172A' }}>
                  {(analytics.totalSales / analytics.totalTransactions).toFixed(1)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* No data notice */}
      {!hasData && (
        <div className="card">
          <div className="card-body">
            <div className="alert alert-info" style={{ alignItems: 'flex-start' }}>
              <Info size={16} style={{ flexShrink: 0, marginTop: 1 }} />
              <div>
                <strong>No transaction data yet</strong>
                <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: '#1E40AF' }}>
                  Your analytics will populate here once you have completed transactions.
                  Make sure your products are listed and receiving orders.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Note about time-series */}
      <p style={{ fontSize: '0.8125rem', color: '#94A3B8', marginTop: '1rem', marginBottom: '1.5rem' }}>
        Analytics show aggregate totals from all completed transactions.
      </p>

      {/* ==================== MILESTONE 2 ANALYTICS SECTIONS ==================== */}
      <CustomerSegments />
      <RecommendationWidget />
      <AnalyticsValidation />
      {/* ======================================================================= */}
    </div>
  );
}
