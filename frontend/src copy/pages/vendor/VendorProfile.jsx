import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle2, User, Mail, Phone, Building2, MapPin } from 'lucide-react';
import api from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function VendorProfile() {
  const { user, login, token } = useAuth();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Editable fields: name, phone, businessName, address
  // NOT editable: email, status (backend does not support changing these via PUT)
  const [form, setForm] = useState({
    name: '',
    phone: '',
    businessName: '',
    address: '',
  });

  useEffect(() => {
    if (!user?.id) return;
    fetchProfile();
  }, [user]);

  async function fetchProfile() {
    try {
      // GET /api/vendors/:id (protectVendor + verifyVendorOwnership)
      const res = await api.get(`/vendors/${user.id}`);
      const v = res.data.vendor;
      setProfile(v);
      setForm({
        name: v.name || '',
        phone: v.phone || '',
        businessName: v.businessName || '',
        address: v.address || '',
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load profile.');
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setSuccess('');
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.businessName.trim()) {
      setError('Name and Business Name are required.');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      // PUT /api/vendors/:id (updatable: name, phone, businessName, address)
      const res = await api.put(`/vendors/${user.id}`, {
        name: form.name.trim(),
        phone: form.phone.trim(),
        businessName: form.businessName.trim(),
        address: form.address.trim(),
      });

      const updatedVendor = res.data.vendor;
      setProfile((prev) => ({ ...prev, ...updatedVendor }));

      // Update auth context so topbar reflects new name/businessName
      login(
        { ...user, name: updatedVendor.name, businessName: updatedVendor.businessName },
        token,
        'vendor'
      );

      setSuccess('Profile updated successfully.');

    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingSpinner message="Loading profile..." />;

  return (
    <div style={{ maxWidth: 640 }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 className="page-title">My Profile</h2>
        <p className="page-subtitle">Manage your account information</p>
      </div>

      {/* Status card */}
      {profile && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {/* Avatar */}
            <div style={{
              width: 52, height: 52, borderRadius: 12,
              background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: 700, fontSize: '1.125rem', flexShrink: 0,
            }}>
              {profile.name?.charAt(0)?.toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '1rem' }}>
                {profile.name}
              </div>
              <div style={{ fontSize: '0.8125rem', color: '#64748B' }}>
                {profile.businessName}
              </div>
            </div>
            <div>
              <StatusBadge status={profile.status} />
            </div>
          </div>
        </div>
      )}

      {/* Edit form */}
      <div className="card">
        <div className="card-header">
          <h3 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 600, color: '#0F172A' }}>
            Account Information
          </h3>
        </div>
        <div className="card-body">
          {success && (
            <div className="alert alert-success" style={{ marginBottom: '1rem' }}>
              <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
              <span>{success}</span>
            </div>
          )}
          {error && (
            <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-grid" style={{ gap: '1.125rem' }}>

              {/* Name */}
              <div className="form-group">
                <label className="form-label" htmlFor="prof-name">
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <User size={14} /> Full Name
                  </span>
                </label>
                <input
                  id="prof-name" name="name" type="text"
                  className="form-input"
                  value={form.name} onChange={handleChange} disabled={saving}
                />
              </div>

              {/* Email — read only */}
              <div className="form-group">
                <label className="form-label">
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Mail size={14} /> Email Address
                  </span>
                </label>
                <input
                  type="email"
                  className="form-input"
                  value={profile?.email || ''}
                  disabled
                />
                <span className="form-hint">Email address cannot be changed.</span>
              </div>

              {/* Business Name */}
              <div className="form-group">
                <label className="form-label" htmlFor="prof-businessName">
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Building2 size={14} /> Business Name
                  </span>
                </label>
                <input
                  id="prof-businessName" name="businessName" type="text"
                  className="form-input"
                  value={form.businessName} onChange={handleChange} disabled={saving}
                />
              </div>

              {/* Phone */}
              <div className="form-group">
                <label className="form-label" htmlFor="prof-phone">
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Phone size={14} /> Phone Number
                  </span>
                </label>
                <input
                  id="prof-phone" name="phone" type="tel"
                  className="form-input"
                  value={form.phone} onChange={handleChange} disabled={saving}
                  placeholder="Not provided"
                />
              </div>

              {/* Address */}
              <div className="form-group">
                <label className="form-label" htmlFor="prof-address">
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <MapPin size={14} /> Business Address
                  </span>
                </label>
                <input
                  id="prof-address" name="address" type="text"
                  className="form-input"
                  value={form.address} onChange={handleChange} disabled={saving}
                  placeholder="Not provided"
                />
              </div>

              {/* Account status — read only */}
              <div className="form-group">
                <label className="form-label">Account Status</label>
                <div style={{ paddingTop: '0.25rem' }}>
                  {profile && <StatusBadge status={profile.status} />}
                </div>
                <span className="form-hint">Account status is managed by the ShopSense administrator.</span>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.25rem' }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                >
                  {saving ? <><span className="spinner" />Saving...</> : 'Save Changes'}
                </button>
              </div>

            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
