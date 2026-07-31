import { useState, useEffect } from 'react';
import { CheckCircle, ShieldAlert, Users, Search } from 'lucide-react';
import api from '../../api/api';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import ConfirmDialog from '../../components/ConfirmDialog';

export default function VendorManagement() {
  const [vendors, setVendors] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Action dialog states
  const [confirmTarget, setConfirmTarget] = useState(null); // { id, name, action: 'approve' | 'suspend' }
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchVendors();
  }, []);

  async function fetchVendors() {
    setLoading(true);
    try {
      // GET /api/admin/vendors
      const res = await api.get('/admin/vendors');
      setVendors(res.data.vendors || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to retrieve vendors.');
    } finally {
      setLoading(false);
    }
  }

  function handleActionClick(vendor, action) {
    setConfirmTarget({
      id: vendor._id,
      name: vendor.name,
      businessName: vendor.businessName,
      action,
    });
  }

  async function executeVendorAction() {
    if (!confirmTarget) return;
    setActionLoading(true);

    const { id, action } = confirmTarget;

    try {
      let res;
      if (action === 'approve') {
        // PUT /api/admin/vendors/:id/approve
        res = await api.put(`/admin/vendors/${id}/approve`);
      } else {
        // PUT /api/admin/vendors/:id/suspend
        res = await api.put(`/admin/vendors/${id}/suspend`);
      }

      const updatedVendor = res.data.vendor;

      // Update state immediately without page refresh
      setVendors((prev) =>
        prev.map((v) => (v._id === id ? { ...v, status: updatedVendor.status } : v))
      );

      setConfirmTarget(null);
    } catch (err) {
      alert(err.response?.data?.message || `Failed to ${action} vendor.`);
    } finally {
      setActionLoading(false);
    }
  }

  // Filter logic
  const filteredVendors = vendors.filter((v) => {
    const matchesSearch =
      v.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.businessName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || v.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) return <LoadingSpinner message="Loading vendors list..." />;

  if (error) {
    return (
      <div className="alert alert-error" style={{ maxWidth: 500 }}>
        {error}
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Vendor Management</h2>
          <p className="page-subtitle">Review, approve, or suspend marketplace vendor accounts</p>
        </div>
      </div>

      {/* Filters bar */}
      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <div className="card-body" style={{ padding: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {/* Search input */}
          <div className="input-wrapper" style={{ flex: 1, minWidth: 240 }}>
            <Search className="input-icon-left" size={16} />
            <input
              type="text"
              className="form-input has-icon-left"
              placeholder="Search vendor name, business, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Status filter tabs */}
          <div className="tab-list" style={{ minWidth: 280 }}>
            {['ALL', 'PENDING', 'APPROVED', 'SUSPENDED'].map((st) => (
              <button
                key={st}
                type="button"
                className={`tab-btn ${statusFilter === st ? 'active' : ''}`}
                onClick={() => setStatusFilter(st)}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Vendors table */}
      <div className="card">
        {filteredVendors.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No vendors found"
            description="No vendor accounts match your current filters."
          />
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Vendor</th>
                  <th>Business Name</th>
                  <th>Contact Info</th>
                  <th>Status</th>
                  <th>Joined Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredVendors.map((vendor) => (
                  <tr key={vendor._id}>
                    {/* Vendor Name */}
                    <td>
                      <div style={{ fontWeight: 600, color: '#0F172A' }}>{vendor.name}</div>
                    </td>

                    {/* Business Name */}
                    <td>
                      <div style={{ fontWeight: 500, color: '#334155' }}>{vendor.businessName}</div>
                    </td>

                    {/* Contact Info */}
                    <td>
                      <div style={{ fontSize: '0.875rem', color: '#0F172A' }}>{vendor.email}</div>
                      {vendor.phone && (
                        <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{vendor.phone}</div>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td>
                      <StatusBadge status={vendor.status} />
                    </td>

                    {/* Joined Date */}
                    <td style={{ fontSize: '0.8125rem', color: '#64748B' }}>
                      {new Date(vendor.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>

                    {/* Actions */}
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.375rem', justifyContent: 'flex-end' }}>
                        {/* PENDING or SUSPENDED vendors can be APPROVED */}
                        {(vendor.status === 'PENDING' || vendor.status === 'SUSPENDED') && (
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => handleActionClick(vendor, 'approve')}
                            title="Approve vendor account"
                          >
                            <CheckCircle size={14} />
                            Approve
                          </button>
                        )}

                        {/* APPROVED vendors can be SUSPENDED */}
                        {vendor.status === 'APPROVED' && (
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleActionClick(vendor, 'suspend')}
                            title="Suspend vendor account"
                          >
                            <ShieldAlert size={14} />
                            Suspend
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!confirmTarget}
        title={confirmTarget?.action === 'approve' ? 'Approve Vendor' : 'Suspend Vendor'}
        message={
          confirmTarget?.action === 'approve'
            ? `Are you sure you want to approve "${confirmTarget?.businessName}" (${confirmTarget?.name})? They will immediately gain access to the vendor dashboard.`
            : `Are you sure you want to suspend "${confirmTarget?.businessName}" (${confirmTarget?.name})? They will be blocked from logging in or using vendor APIs.`
        }
        confirmLabel={confirmTarget?.action === 'approve' ? 'Approve Account' : 'Suspend Account'}
        confirmVariant={confirmTarget?.action === 'approve' ? 'primary' : 'danger'}
        onConfirm={executeVendorAction}
        onCancel={() => setConfirmTarget(null)}
        loading={actionLoading}
      />
    </div>
  );
}
