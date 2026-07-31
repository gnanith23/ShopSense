import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import api from '../../api/api';

// Fields based on backend Vendor model:
// name (required), email (required), password (required),
// businessName (required), phone (optional), address (optional)

export default function VendorRegister() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    businessName: '',
    phone: '',
    address: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Clear individual field error on change
    setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    setError('');
  }

  function validate() {
    const errors = {};
    if (!form.name.trim()) errors.name = 'Full name is required.';
    if (!form.email.trim()) errors.email = 'Email address is required.';
    if (!form.password.trim()) errors.password = 'Password is required.';
    else if (form.password.length < 6) errors.password = 'Password must be at least 6 characters.';
    if (!form.businessName.trim()) errors.businessName = 'Business name is required.';
    return errors;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);

    try {
      // POST /api/vendors/register
      await api.post('/vendors/register', {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        businessName: form.businessName.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
      });

      // Registration successful — show pending approval state
      setSuccess(true);

    } catch (err) {
      const message =
        err.response?.data?.message ||
        'Registration failed. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  // Success state — account pending admin approval
  if (success) {
    return (
      <div className="auth-page">
        <div style={{ width: '100%', maxWidth: '440px', textAlign: 'center' }}>
          <div style={{
            width: 64, height: 64,
            background: '#D1FAE5',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1.25rem',
          }}>
            <CheckCircle2 size={28} color="#059669" />
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0F172A', margin: '0 0 0.5rem' }}>
            Registration Submitted!
          </h2>
          <p style={{ color: '#64748B', fontSize: '0.9375rem', margin: '0 0 1.5rem', lineHeight: 1.6 }}>
            Your vendor account has been created and is currently{' '}
            <strong>awaiting admin approval</strong>. You will be able to log in
            once your account is approved.
          </p>
          <div className="alert alert-info" style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>
              Please check back later or contact the ShopSense admin to expedite your approval.
            </span>
          </div>
          <Link to="/login" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div style={{ width: '100%', maxWidth: '480px' }}>
        {/* Logo */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.625rem',
          justifyContent: 'center', marginBottom: '1.75rem',
        }}>
          <div style={{
            width: 38, height: 38, background: '#4F46E5', borderRadius: 9,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <ShoppingBag size={18} color="white" />
          </div>
          <span style={{ fontSize: '1.375rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.03em' }}>
            Shop<span style={{ color: '#4F46E5' }}>Sense</span>
          </span>
        </div>

        {/* Card */}
        <div className="card">
          <div className="card-header">
            <div>
              <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0F172A' }}>
                Register as a Vendor
              </h2>
              <p style={{ margin: '3px 0 0', fontSize: '0.8125rem', color: '#64748B' }}>
                Fill in your details to apply for a vendor account
              </p>
            </div>
          </div>

          <div className="card-body">
            {/* Error alert */}
            {error && (
              <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
                <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-grid" style={{ gap: '1rem' }}>

                {/* Name + Business Name row */}
                <div className="form-grid form-grid-2" style={{ gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="reg-name">
                      Full Name <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <input
                      id="reg-name"
                      name="name"
                      type="text"
                      className={`form-input ${fieldErrors.name ? 'error' : ''}`}
                      placeholder="John Smith"
                      value={form.name}
                      onChange={handleChange}
                      disabled={loading}
                    />
                    {fieldErrors.name && (
                      <span className="form-error">{fieldErrors.name}</span>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="reg-businessName">
                      Business Name <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <input
                      id="reg-businessName"
                      name="businessName"
                      type="text"
                      className={`form-input ${fieldErrors.businessName ? 'error' : ''}`}
                      placeholder="Smith Enterprises"
                      value={form.businessName}
                      onChange={handleChange}
                      disabled={loading}
                    />
                    {fieldErrors.businessName && (
                      <span className="form-error">{fieldErrors.businessName}</span>
                    )}
                  </div>
                </div>

                {/* Email */}
                <div className="form-group">
                  <label className="form-label" htmlFor="reg-email">
                    Email Address <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    id="reg-email"
                    name="email"
                    type="email"
                    className={`form-input ${fieldErrors.email ? 'error' : ''}`}
                    placeholder="john@smithenterprises.com"
                    value={form.email}
                    onChange={handleChange}
                    disabled={loading}
                  />
                  {fieldErrors.email && (
                    <span className="form-error">{fieldErrors.email}</span>
                  )}
                </div>

                {/* Password */}
                <div className="form-group">
                  <label className="form-label" htmlFor="reg-password">
                    Password <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <div className="input-wrapper">
                    <input
                      id="reg-password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      className={`form-input has-icon-right ${fieldErrors.password ? 'error' : ''}`}
                      placeholder="Minimum 6 characters"
                      value={form.password}
                      onChange={handleChange}
                      disabled={loading}
                    />
                    <button
                      type="button"
                      className="input-icon-right"
                      onClick={() => setShowPassword((v) => !v)}
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {fieldErrors.password && (
                    <span className="form-error">{fieldErrors.password}</span>
                  )}
                </div>

                {/* Phone */}
                <div className="form-group">
                  <label className="form-label" htmlFor="reg-phone">
                    Phone Number <span style={{ color: '#94A3B8', fontSize: '0.8125rem' }}>(optional)</span>
                  </label>
                  <input
                    id="reg-phone"
                    name="phone"
                    type="tel"
                    className="form-input"
                    placeholder="+1 555 000 0000"
                    value={form.phone}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </div>

                {/* Address */}
                <div className="form-group">
                  <label className="form-label" htmlFor="reg-address">
                    Business Address <span style={{ color: '#94A3B8', fontSize: '0.8125rem' }}>(optional)</span>
                  </label>
                  <input
                    id="reg-address"
                    name="address"
                    type="text"
                    className="form-input"
                    placeholder="123 Main St, City, State"
                    value={form.address}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  className="btn btn-primary btn-lg"
                  disabled={loading}
                  style={{ marginTop: '0.25rem' }}
                >
                  {loading ? (
                    <>
                      <span className="spinner" />
                      Submitting...
                    </>
                  ) : 'Submit Registration'}
                </button>

              </div>
            </form>
          </div>
        </div>

        {/* Login link */}
        <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.875rem', color: '#64748B' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#4F46E5', fontWeight: 500, textDecoration: 'none' }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
