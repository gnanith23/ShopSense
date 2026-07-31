import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Clock, CheckCircle2, AlertOctagon, ArrowRight } from 'lucide-react';
import api from '../../api/api';
import StatCard from '../../components/StatCard';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function AdminDashboard() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchVendors();
  }, []);

  async function fetchVendors() {
    try {
      // GET /api/admin/vendors (requires protectAdmin)
      const res = await api.get('/admin/vendors');
      setVendors(res.data.vendors || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch vendor statistics.');
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <LoadingSpinner message="Loading admin overview..." />;

  if (error) {
    return (
      <div className="alert alert-error" style={{ maxWidth: 500 }}>
        {error}
      </div>
    );
  }

  const total = vendors.length;
  const pending = vendors.filter((v) => v.status === 'PENDING').length;
  const approved = vendors.filter((v) => v.status === 'APPROVED').length;
  const suspended = vendors.filter((v) => v.status === 'SUSPENDED').length;

  const recentVendors = vendors.slice(0, 5);

  return (
    <div>
      {/* Overview header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 className="page-title">Admin Dashboard</h2>
        <p className="page-subtitle">Marketplace vendor status & platform metrics</p>
      </div>

      {/* Stat cards derived dynamically from API */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <StatCard
          label="Total Vendors"
          value={total}
          icon={Users}
          iconBg="#EEF2FF"
          iconColor="#4F46E5"
        />
        <StatCard
          label="Pending Approval"
          value={pending}
          icon={Clock}
          iconBg="#FEF3C7"
          iconColor="#D97706"
        />
        <StatCard
          label="Approved Vendors"
          value={approved}
          icon={CheckCircle2}
          iconBg="#D1FAE5"
          iconColor="#059669"
        />
        <StatCard
          label="Suspended Vendors"
          value={suspended}
          icon={AlertOctagon}
          iconBg="#FEE2E2"
          iconColor="#DC2626"
        />
      </div>

      {/* Recent vendors table */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 600, color: '#0F172A' }}>
              Recent Vendors
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: '0.8125rem', color: '#64748B' }}>
              Latest vendor applications and accounts
            </p>
          </div>
          <Link to="/admin/vendors" className="btn btn-ghost btn-sm">
            Manage all <ArrowRight size={14} />
          </Link>
        </div>

        {recentVendors.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#94A3B8', fontSize: '0.875rem' }}>
            No vendors registered in the platform yet.
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Vendor</th>
                  <th>Business</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {recentVendors.map((vendor) => (
                  <tr key={vendor._id}>
                    <td style={{ fontWeight: 600, color: '#0F172A' }}>{vendor.name}</td>
                    <td>{vendor.businessName}</td>
                    <td style={{ color: '#64748B' }}>{vendor.email}</td>
                    <td><StatusBadge status={vendor.status} /></td>
                    <td style={{ fontSize: '0.8125rem', color: '#64748B' }}>
                      {new Date(vendor.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
