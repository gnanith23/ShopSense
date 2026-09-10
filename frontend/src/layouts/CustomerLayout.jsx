import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom';
import { ShoppingBag, Package, LogOut, User, Sparkles, Store, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/api';

export default function CustomerLayout() {
  const { user, logout, login } = useAuth();
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [showSwitcher, setShowSwitcher] = useState(false);

  useEffect(() => {
    async function loadCustomers() {
      try {
        const res = await api.get('/customers');
        setCustomers(res.data.customers || []);
      } catch (err) {
        console.warn('Failed to fetch customers list:', err);
      }
    }
    loadCustomers();
  }, []);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  async function handleSwitchCustomer(c) {
    try {
      const res = await api.post('/customers/login', { customerId: c._id });
      login(res.data.customer, res.data.token, 'customer');
      setShowSwitcher(false);
      window.location.reload();
    } catch (err) {
      console.error('Switch customer failed:', err);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#F8FAFC' }}>
      {/* Customer Header Navbar */}
      <header style={{
        background: 'white',
        borderBottom: '1px solid #E2E8F0',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        <div style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '0 1.25rem',
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem'
        }}>
          {/* Logo & Branding */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <Link to="/marketplace" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
              <div style={{
                width: 34, height: 34,
                background: '#4F46E5',
                borderRadius: 8,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white'
              }}>
                <ShoppingBag size={18} />
              </div>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
                Shop<span style={{ color: '#4F46E5' }}>Sense</span>
              </span>
              <span style={{
                fontSize: '0.6875rem',
                fontWeight: 700,
                background: '#EEF2FF',
                color: '#4F46E5',
                padding: '2px 7px',
                borderRadius: 999,
                marginLeft: 4,
                letterSpacing: '0.04em'
              }}>
                MARKETPLACE
              </span>
            </Link>

            {/* Navigation Links */}
            <nav style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <NavLink
                to="/marketplace"
                style={({ isActive }) => ({
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  padding: '0.45rem 0.85rem',
                  borderRadius: 6,
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                  color: isActive ? '#4F46E5' : '#64748B',
                  background: isActive ? '#EEF2FF' : 'transparent',
                  transition: 'all 0.15s ease'
                })}
              >
                <Store size={16} />
                Marketplace
              </NavLink>

              <NavLink
                to="/customer/purchases"
                style={({ isActive }) => ({
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  padding: '0.45rem 0.85rem',
                  borderRadius: 6,
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                  color: isActive ? '#4F46E5' : '#64748B',
                  background: isActive ? '#EEF2FF' : 'transparent',
                  transition: 'all 0.15s ease'
                })}
              >
                <Package size={16} />
                My Purchases & Reviews
              </NavLink>
            </nav>
          </div>

          {/* Right Section: Customer Profile & Switcher & Logout */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {user ? (
              <div style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => setShowSwitcher(!showSwitcher)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.375rem 0.75rem',
                    background: '#F1F5F9',
                    border: '1px solid #CBD5E1',
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontSize: '0.8125rem'
                  }}
                  title="Click to switch customer account"
                >
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%',
                    background: '#4F46E5', color: 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.6875rem', fontWeight: 700
                  }}>
                    {user.name ? user.name.charAt(0).toUpperCase() : 'C'}
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 600, color: '#0F172A', lineHeight: 1.2 }}>
                      {user.name || 'Customer'}
                    </div>
                    <div style={{ fontSize: '0.6875rem', color: '#64748B' }}>
                      {user.email}
                    </div>
                  </div>
                </button>

                {/* Switcher Dropdown */}
                {showSwitcher && (
                  <div style={{
                    position: 'absolute',
                    right: 0,
                    top: '110%',
                    width: 280,
                    background: 'white',
                    borderRadius: 8,
                    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
                    border: '1px solid #E2E8F0',
                    zIndex: 200,
                    padding: '0.5rem 0'
                  }}>
                    <div style={{ padding: '0.5rem 0.75rem', fontSize: '0.75rem', fontWeight: 700, color: '#64748B', borderBottom: '1px solid #F1F5F9' }}>
                      SWITCH CUSTOMER PROFILE
                    </div>
                    <div style={{ maxHeight: 220, overflowY: 'auto' }}>
                      {customers.map((c) => (
                        <button
                          key={c._id}
                          onClick={() => handleSwitchCustomer(c)}
                          style={{
                            width: '100%',
                            textAlign: 'left',
                            padding: '0.5rem 0.75rem',
                            border: 'none',
                            background: (c._id === user._id || c._id === user.id) ? '#EEF2FF' : 'transparent',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            fontSize: '0.8125rem'
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 600, color: '#0F172A' }}>{c.name}</div>
                            <div style={{ fontSize: '0.6875rem', color: '#64748B' }}>{c.email}</div>
                          </div>
                          {(c._id === user._id || c._id === user.id) && (
                            <CheckCircle size={14} color="#4F46E5" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className="btn btn-primary btn-sm">
                Sign In
              </Link>
            )}

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="btn btn-secondary btn-sm"
              title="Sign Out"
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <LogOut size={14} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Page Content */}
      <main style={{ flex: 1, padding: '1.5rem 1rem' }}>
        <Outlet />
      </main>
    </div>
  );
}
