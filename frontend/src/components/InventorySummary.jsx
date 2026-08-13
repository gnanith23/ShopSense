import { useState, useEffect } from 'react';
import { Package, AlertTriangle, XCircle, CheckCircle, RefreshCw } from 'lucide-react';
import api from '../api/api';

// InventorySummary — Milestone 2 Requirement 1
// Fetches GET /api/inventory/summary and renders 4 stat cards.
// Uses Product.stock as source of truth (via backend API).

export default function InventorySummary() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSummary();
  }, []);

  async function fetchSummary() {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/inventory/summary');
      setSummary(res.data.summary);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load inventory summary.');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '1.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748B', fontSize: '0.875rem' }}>
        <div className="spinner spinner-dark" style={{ width: 18, height: 18, borderWidth: 2 }} />
        Loading inventory overview...
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
        {error}
        <button
          onClick={fetchSummary}
          style={{ marginLeft: '0.75rem', background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626', padding: 0 }}
          title="Retry"
        >
          <RefreshCw size={14} />
        </button>
      </div>
    );
  }

  const cards = [
    {
      label: 'Total Products',
      value: summary?.totalProducts ?? 0,
      icon: Package,
      iconBg: '#EEF2FF',
      iconColor: '#4F46E5',
      borderColor: '#4F46E5',
    },
    {
      label: 'Total Stock Units',
      value: summary?.totalStockUnits ?? 0,
      icon: CheckCircle,
      iconBg: '#F0FDF4',
      iconColor: '#059669',
      borderColor: '#059669',
    },
    {
      label: 'Low Stock',
      value: summary?.lowStockCount ?? 0,
      icon: AlertTriangle,
      iconBg: '#FFF7ED',
      iconColor: '#EA580C',
      borderColor: '#EA580C',
      highlight: (summary?.lowStockCount ?? 0) > 0,
    },
    {
      label: 'Out of Stock',
      value: summary?.outOfStockCount ?? 0,
      icon: XCircle,
      iconBg: '#FFF1F2',
      iconColor: '#DC2626',
      borderColor: '#DC2626',
      highlight: (summary?.outOfStockCount ?? 0) > 0,
    },
  ];

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      {/* Section header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.875rem' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 600, color: '#0F172A' }}>
            Inventory Overview
          </h3>
          <p style={{ margin: '2px 0 0', fontSize: '0.8125rem', color: '#64748B' }}>
            Live stock metrics from your catalog
          </p>
        </div>
        <button
          onClick={fetchSummary}
          style={{
            background: 'none', border: '1px solid #E2E8F0', borderRadius: 6,
            padding: '4px 8px', cursor: 'pointer', color: '#64748B',
            display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem',
          }}
          title="Refresh inventory data"
        >
          <RefreshCw size={12} />
          Refresh
        </button>
      </div>

      {/* 4-column stat cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: '0.875rem',
      }}>
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              style={{
                background: 'white',
                border: `1px solid ${card.highlight ? card.borderColor + '66' : '#E2E8F0'}`,
                borderRadius: 12,
                padding: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.875rem',
                boxShadow: card.highlight
                  ? `0 0 0 3px ${card.borderColor}15`
                  : '0 1px 3px rgba(0,0,0,0.04)',
              }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: 9,
                background: card.iconBg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Icon size={18} color={card.iconColor} />
              </div>
              <div>
                <div style={{ fontSize: '1.375rem', fontWeight: 700, color: card.highlight ? card.iconColor : '#0F172A', lineHeight: 1 }}>
                  {card.value}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: 3, fontWeight: 500 }}>
                  {card.label}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
