import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, ShoppingBag, AlertCircle } from 'lucide-react';
import api from '../../api/api';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  // Tab state: 'vendor' or 'admin'
  const [activeTab, setActiveTab] = useState('vendor');

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function handleTabSwitch(tab) {
    setActiveTab(tab);
    setError('');
    setEmail('');
    setPassword('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }

    setLoading(true);

    try {
      let response;

      if (activeTab === 'vendor') {
        // POST /api/vendors/login
        response = await api.post('/vendors/login', { email, password });
        const { token, vendor } = response.data;
        login(vendor, token, 'vendor');
        navigate('/vendor/dashboard');
      } else {
        // POST /api/admin/login
        response = await api.post('/admin/login', { email, password });
        const { token, admin } = response.data;
        login(admin, token, 'admin');
        navigate('/admin/dashboard');
      }

    } catch (err) {
      // Show backend error message when available
      const message =
        err.response?.data?.message ||
        'Login failed. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div style={{ width: '100%', maxWidth: '420px' }}>
        {/* Logo */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.625rem',
          justifyContent: 'center',
          marginBottom: '2rem',
        }}>
          <div style={{
            width: 40, height: 40,
            background: '#4F46E5',
            borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <ShoppingBag size={20} color="white" />
          </div>
          <span style={{
            fontSize: '1.5rem',
            fontWeight: 800,
            color: '#0F172A',
            letterSpacing: '-0.03em',
          }}>
            Shop<span style={{ color: '#4F46E5' }}>Sense</span>
          </span>
        </div>

        {/* Card */}
        <div className="card">
          <div className="card-body">
            {/* Heading */}
            <div style={{ marginBottom: '1.25rem', textAlign: 'center' }}>
              <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700, color: '#0F172A' }}>
                Sign in to your account
              </h2>
              <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: '#64748B' }}>
                Choose your role below
              </p>
            </div>

            {/* Tab switcher */}
            <div className="tab-list" style={{ marginBottom: '1.25rem' }}>
              <button
                type="button"
                className={`tab-btn ${activeTab === 'vendor' ? 'active' : ''}`}
                onClick={() => handleTabSwitch('vendor')}
              >
                Vendor Login
              </button>
              <button
                type="button"
                className={`tab-btn ${activeTab === 'admin' ? 'active' : ''}`}
                onClick={() => handleTabSwitch('admin')}
              >
                Admin Login
              </button>
            </div>

            {/* Error alert */}
            {error && (
              <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
                <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Email */}
              <div className="form-group">
                <label className="form-label" htmlFor="login-email">
                  Email address
                </label>
                <input
                  id="login-email"
                  type="email"
                  className={`form-input ${error ? 'error' : ''}`}
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  autoComplete="email"
                  disabled={loading}
                />
              </div>

              {/* Password */}
              <div className="form-group">
                <label className="form-label" htmlFor="login-password">
                  Password
                </label>
                <div className="input-wrapper">
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    className={`form-input has-icon-right ${error ? 'error' : ''}`}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(''); }}
                    autoComplete="current-password"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="input-icon-right"
                    onClick={() => setShowPassword((v) => !v)}
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
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
                    Signing in...
                  </>
                ) : (
                  `Sign in as ${activeTab === 'vendor' ? 'Vendor' : 'Admin'}`
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Register link — vendor only */}
        {activeTab === 'vendor' && (
          <p style={{
            textAlign: 'center',
            marginTop: '1rem',
            fontSize: '0.875rem',
            color: '#64748B',
          }}>
            New vendor?{' '}
            <Link
              to="/register"
              style={{ color: '#4F46E5', fontWeight: 500, textDecoration: 'none' }}
            >
              Register your business
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
