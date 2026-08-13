import { useState, useEffect } from 'react';
import { ShieldCheck, ShieldAlert, AlertCircle, Info, RefreshCw } from 'lucide-react';
import api from '../api/api';

// AnalyticsValidation — Milestone 2 Requirement 4
// Fetches GET /api/analytics/validation
// Shows PASS / FAIL / INSUFFICIENT_DATA / ERROR per validation module.
// Never fabricates results — displays actual backend response.

const STATUS_CONFIG = {
  PASS: {
    label: 'PASS',
    color: '#059669',
    bg: '#F0FDF4',
    border: '#BBF7D0',
    icon: ShieldCheck,
  },
  FAIL: {
    label: 'FAIL',
    color: '#DC2626',
    bg: '#FFF1F2',
    border: '#FECDD3',
    icon: ShieldAlert,
  },
  INSUFFICIENT_DATA: {
    label: 'INSUFFICIENT DATA',
    color: '#D97706',
    bg: '#FFFBEB',
    border: '#FDE68A',
    icon: Info,
  },
  ERROR: {
    label: 'ERROR',
    color: '#9333EA',
    bg: '#FAF5FF',
    border: '#E9D5FF',
    icon: AlertCircle,
  },
  PARTIAL: {
    label: 'PARTIAL',
    color: '#EA580C',
    bg: '#FFF7ED',
    border: '#FED7AA',
    icon: AlertCircle,
  },
};

function ValidationStatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.ERROR;
  const Icon = cfg.icon;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
      background: cfg.bg, color: cfg.color,
      border: `1px solid ${cfg.border}`,
      padding: '3px 10px', borderRadius: 20,
      fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.04em',
    }}>
      <Icon size={11} />
      {cfg.label}
    </span>
  );
}

function ValidationRow({ title, description, result }) {
  if (!result) return null;

  const cfg = STATUS_CONFIG[result.status] || STATUS_CONFIG.ERROR;

  // Build a readable detail string
  let detail = result.explanation || '';
  if (result.status === 'PASS') {
    if (result.checkedProducts !== undefined) detail = `${result.checkedProducts} product${result.checkedProducts !== 1 ? 's' : ''} verified`;
    if (result.checkedCustomers !== undefined) detail = `${result.checkedCustomers} customer${result.checkedCustomers !== 1 ? 's' : ''} verified`;
    if (result.validatedCategory) detail = `Category "${result.validatedCategory}" — top product matches`;
  }
  if (result.status === 'INSUFFICIENT_DATA') {
    detail = result.explanation || 'Not enough historical data to validate.';
  }
  if (result.failCount > 0) {
    detail = `${result.failCount} mismatch(es) found — ${result.explanation}`;
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
      gap: '1rem', padding: '0.875rem 1rem',
      borderRadius: 10, background: cfg.bg,
      border: `1px solid ${cfg.border}`,
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#0F172A', marginBottom: '0.25rem' }}>
          {title}
        </div>
        <div style={{ fontSize: '0.8125rem', color: '#475569' }}>{description}</div>
        {detail && (
          <div style={{ fontSize: '0.78rem', color: cfg.color, marginTop: '0.3rem', fontWeight: 500 }}>
            {detail}
          </div>
        )}
      </div>
      <div style={{ flexShrink: 0 }}>
        <ValidationStatusBadge status={result.status} />
      </div>
    </div>
  );
}

export default function AnalyticsValidation() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchValidation();
  }, []);

  async function fetchValidation() {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/analytics/validation');
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to run analytical validation.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card" style={{ marginBottom: '1.5rem' }}>
      {/* Card header */}
      <div className="card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ShieldCheck size={16} color="#4F46E5" />
          <div>
            <h3 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 600, color: '#0F172A' }}>
              Analytical Validation
            </h3>
            <p style={{ margin: '1px 0 0', fontSize: '0.8125rem', color: '#64748B' }}>
              Cross-checks analytics outputs against raw historical data
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Overall status badge */}
          {data?.overallStatus && (
            <ValidationStatusBadge status={data.overallStatus} />
          )}
          <button
            onClick={fetchValidation}
            style={{ background: 'none', border: '1px solid #E2E8F0', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', color: '#64748B', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem' }}
          >
            <RefreshCw size={12} /> Re-validate
          </button>
        </div>
      </div>

      <div className="card-body">
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748B', fontSize: '0.875rem' }}>
            <div className="spinner spinner-dark" style={{ width: 18, height: 18, borderWidth: 2 }} />
            Validating analytics against historical data...
          </div>
        )}

        {error && !loading && (
          <div className="alert alert-error">
            {error}
            <button onClick={fetchValidation} style={{ marginLeft: '0.5rem', background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626', padding: 0 }}>
              <RefreshCw size={13} />
            </button>
          </div>
        )}

        {!loading && !error && data && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            <ValidationRow
              title="Inventory Validation"
              description="Compares Product.stock sum from direct query vs. aggregation pipeline"
              result={data.validationReport?.inventoryValidation}
            />
            <ValidationRow
              title="Customer Segmentation Validation"
              description="Verifies each customer's totalSpent matches raw transaction records"
              result={data.validationReport?.customerSegmentationValidation}
            />
            <ValidationRow
              title="Recommendation Validation"
              description="Confirms top product's units-sold ranking matches raw transaction count"
              result={data.validationReport?.recommendationValidation}
            />

            <p style={{ margin: '0.5rem 0 0', fontSize: '0.75rem', color: '#94A3B8', paddingTop: '0.5rem', borderTop: '1px solid #F1F5F9' }}>
              Validation runs live against your MongoDB data. Results reflect actual data integrity, not estimates.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
