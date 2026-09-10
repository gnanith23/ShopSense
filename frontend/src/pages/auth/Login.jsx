import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, ShoppingBag, AlertCircle } from 'lucide-react';
import api from '../../api/api';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  // Tab state: 'customer' | 'vendor' | 'admin'
  const [activeTab, setActiveTab] = useState('customer');

  // Customer sub-mode: 'login' | 'register'
  const [customerMode, setCustomerMode] = useState('login');
  const [regForm, setRegForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    address: ''
  });
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Quick customer picker state
  const [existingCustomers, setExistingCustomers] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Load existing customers on mount or when switching to customer tab
  const fetchExistingCustomers = async () => {
    try {
      setLoadingCustomers(true);
      const res = await api.get('/customers');
      setExistingCustomers(res.data.customers || []);
    } catch (err) {
      console.warn('Failed to pre-fetch customers list:', err.message);
    } finally {
      setLoadingCustomers(false);
    }
  };

  function handleTabSwitch(tab) {
    setActiveTab(tab);
    setCustomerMode('login');
    setError('');
    setSuccessMsg('');
    setEmail('');
    setPassword('');
    if (tab === 'customer' && existingCustomers.length === 0) {
      fetchExistingCustomers();
    }
  }

  async function handleCustomerRegister(e) {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!regForm.name.trim() || !regForm.email.trim() || !regForm.phone.trim()) {
      setError('Please provide Name, Email, and Phone number.');
      return;
    }

    if (!regForm.password || regForm.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      // 1. Create customer and save to MongoDB: POST /api/customers
      const regRes = await api.post('/customers', {
        name: regForm.name.trim(),
        email: regForm.email.trim().toLowerCase(),
        password: regForm.password,
        phone: regForm.phone.trim(),
        address: regForm.address.trim() || '123 Test Street'
      });

      // 2. Automatically log in the newly registered customer: POST /api/customers/login
      const loginRes = await api.post('/customers/login', {
        email: regForm.email.trim().toLowerCase(),
        password: regForm.password
      });
      const { token, customer } = loginRes.data;
      login(customer, token, 'customer');
      navigate('/marketplace');

    } catch (err) {
      const message =
        err.response?.data?.message ||
        'Registration failed. Customer email may already exist.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    // Require password for vendor and admin
    if (activeTab !== 'customer' && !password.trim()) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);

    try {
      let response;

      if (activeTab === 'customer') {
        // POST /api/customers/login with email and password
        response = await api.post('/customers/login', {
          email: email.trim(),
          password: password ? password.trim() : undefined
        });
        const { token, customer } = response.data;
        login(customer, token, 'customer');
        navigate('/marketplace');
      } else if (activeTab === 'vendor') {
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
      const message =
        err.response?.data?.message ||
        'Login failed. Please check your credentials and try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div style={{ width: '100%', maxWidth: '440px' }}>
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
                Sign in to ShopSense
              </h2>
              <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: '#64748B' }}>
                Select your role to continue
              </p>
            </div>

            {/* Tab switcher */}
            <div className="tab-list" style={{ marginBottom: '1.25rem' }}>
              <button
                type="button"
                className={`tab-btn ${activeTab === 'customer' ? 'active' : ''}`}
                onClick={() => handleTabSwitch('customer')}
              >
                Customer
              </button>
              <button
                type="button"
                className={`tab-btn ${activeTab === 'vendor' ? 'active' : ''}`}
                onClick={() => handleTabSwitch('vendor')}
              >
                Vendor
              </button>
              <button
                type="button"
                className={`tab-btn ${activeTab === 'admin' ? 'active' : ''}`}
                onClick={() => handleTabSwitch('admin')}
              >
                Admin
              </button>
            </div>

            {/* Error alert */}
            {error && (
              <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
                <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>{error}</span>
              </div>
            )}

            {/* Customer Registration Form */}
            {activeTab === 'customer' && customerMode === 'register' ? (
              <form onSubmit={handleCustomerRegister} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                <div style={{
                  padding: '0.625rem 0.75rem',
                  background: '#F0FDF4',
                  borderRadius: 6,
                  border: '1px solid #BBF7D0',
                  fontSize: '0.8125rem',
                  color: '#166534',
                  fontWeight: 500
                }}>
                  Create a new Customer profile for testing
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="reg-name">Full Name *</label>
                  <input
                    id="reg-name"
                    type="text"
                    className="form-input"
                    placeholder="e.g. Maya Lin"
                    value={regForm.name}
                    onChange={(e) => setRegForm(prev => ({ ...prev, name: e.target.value }))}
                    disabled={loading}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="reg-email">Email Address *</label>
                  <input
                    id="reg-email"
                    type="email"
                    className="form-input"
                    placeholder="e.g. maya.lin@example.com"
                    value={regForm.email}
                    onChange={(e) => setRegForm(prev => ({ ...prev, email: e.target.value }))}
                    disabled={loading}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="reg-password">Password * (Min 6 characters)</label>
                  <div className="input-wrapper">
                    <input
                      id="reg-password"
                      type={showRegPassword ? 'text' : 'password'}
                      className="form-input has-icon-right"
                      placeholder="Create a secure password"
                      value={regForm.password}
                      onChange={(e) => setRegForm(prev => ({ ...prev, password: e.target.value }))}
                      disabled={loading}
                      required
                    />
                    <button
                      type="button"
                      className="input-icon-right"
                      onClick={() => setShowRegPassword(v => !v)}
                      tabIndex={-1}
                      aria-label={showRegPassword ? 'Hide password' : 'Show password'}
                    >
                      {showRegPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="reg-phone">Phone Number *</label>
                  <input
                    id="reg-phone"
                    type="tel"
                    className="form-input"
                    placeholder="e.g. 9876543210"
                    value={regForm.phone}
                    onChange={(e) => setRegForm(prev => ({ ...prev, phone: e.target.value }))}
                    disabled={loading}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="reg-address">Shipping Address</label>
                  <input
                    id="reg-address"
                    type="text"
                    className="form-input"
                    placeholder="e.g. 456 Innovation Park"
                    value={regForm.address}
                    onChange={(e) => setRegForm(prev => ({ ...prev, address: e.target.value }))}
                    disabled={loading}
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-lg"
                  disabled={loading}
                  style={{ marginTop: '0.25rem' }}
                >
                  {loading ? (
                    <>
                      <span className="spinner" />
                      Creating Account & Saving to MongoDB...
                    </>
                  ) : (
                    'Register Customer & Go to Marketplace'
                  )}
                </button>

                <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
                  <button
                    type="button"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#4F46E5',
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      padding: 0
                    }}
                    onClick={() => {
                      setCustomerMode('login');
                      setError('');
                    }}
                  >
                    ← Back to Existing Customer Login
                  </button>
                </div>
              </form>
            ) : (
              /* Regular Login Form */
              <>
                {/* Quick Customer Picker */}
                {activeTab === 'customer' && existingCustomers.length > 0 && (
                  <div style={{ marginBottom: '1rem', padding: '0.75rem', background: '#EEF2FF', borderRadius: 8, border: '1px solid #C7D2FE' }}>
                    <label className="form-label" style={{ fontSize: '0.75rem', color: '#4338CA', marginBottom: 4 }}>
                      Select an Existing Customer:
                    </label>
                    <select
                      className="form-input"
                      style={{ background: 'white', fontSize: '0.8125rem' }}
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError('');
                      }}
                    >
                      <option value="">-- Choose registered customer account --</option>
                      {existingCustomers.map((c) => (
                        <option key={c._id} value={c.email}>
                          {c.name} ({c.email})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {/* Email */}
                  <div className="form-group">
                    <label className="form-label" htmlFor="login-email">
                      {activeTab === 'customer' ? 'Customer Email' : 'Email address'}
                    </label>
                    <input
                      id="login-email"
                      type="email"
                      className={`form-input ${error ? 'error' : ''}`}
                      placeholder={activeTab === 'customer' ? 'e.g. rahulcustomer3@shopsense.com' : 'you@example.com'}
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError(''); }}
                      autoComplete="email"
                      disabled={loading}
                    />
                  </div>

                  {/* Password */}
                  <div className="form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.375rem' }}>
                      <label className="form-label" htmlFor="login-password" style={{ marginBottom: 0 }}>
                        Password
                      </label>
                      {activeTab === 'customer' && (
                        <span style={{ fontSize: '0.6875rem', color: '#6366F1' }}>
                          Optional for legacy test accounts
                        </span>
                      )}
                    </div>
                    <div className="input-wrapper">
                      <input
                        id="login-password"
                        type={showPassword ? 'text' : 'password'}
                        className={`form-input has-icon-right ${error ? 'error' : ''}`}
                        placeholder={activeTab === 'customer' ? 'Enter your customer password' : 'Enter your password'}
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
                      `Sign in as ${activeTab === 'customer' ? 'Customer' : activeTab === 'vendor' ? 'Vendor' : 'Admin'}`
                    )}
                  </button>
                </form>

                {/* Customer Register Toggle */}
                {activeTab === 'customer' && (
                  <div style={{ textAlign: 'center', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid #E2E8F0' }}>
                    <p style={{ margin: 0, fontSize: '0.8125rem', color: '#64748B' }}>
                      Testing with a new profile?{' '}
                      <button
                        type="button"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#4F46E5',
                          fontWeight: 600,
                          cursor: 'pointer',
                          padding: 0
                        }}
                        onClick={() => {
                          setCustomerMode('register');
                          setError('');
                        }}
                      >
                        Register as new Customer
                      </button>
                    </p>
                  </div>
                )}
              </>
            )}
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
