import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  PlusCircle,
  BarChart2,
  User,
  LogOut,
  Users,
  ShoppingBag,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// Vendor navigation items
const vendorNavItems = [
  { to: '/vendor/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/vendor/catalog', icon: Package, label: 'My Catalog' },
  { to: '/vendor/products/add', icon: PlusCircle, label: 'Add Product' },
  { to: '/vendor/analytics', icon: BarChart2, label: 'Analytics' },
  { to: '/vendor/customer-purchases', icon: ShoppingBag, label: 'My Purchases (Customer)' },
  { to: '/vendor/profile', icon: User, label: 'Profile' },
];

// Admin navigation items
const adminNavItems = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/vendors', icon: Users, label: 'Vendor Management' },
];

export default function Sidebar({ collapsed, onToggle }) {
  const { role, logout, user } = useAuth();
  const navigate = useNavigate();
  const navItems = role === 'admin' ? adminNavItems : vendorNavItems;

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* Logo */}
      <div className="sidebar-logo">
        <div style={{
          width: '28px', height: '28px',
          background: '#4F46E5',
          borderRadius: '7px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <ShoppingBag size={15} color="white" />
        </div>
        {!collapsed && (
          <span className="sidebar-logo-text">
            Shop<span className="sidebar-logo-dot">Sense</span>
          </span>
        )}
      </div>

      {/* Role label */}
      {!collapsed && (
        <div style={{ padding: '0.5rem 1.25rem', marginTop: '0.25rem' }}>
          <span style={{
            fontSize: '0.6875rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: '#475569',
          }}>
            {role === 'admin' ? 'Admin Panel' : 'Vendor Portal'}
          </span>
        </div>
      )}

      {/* Navigation */}
      <nav className="sidebar-nav">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `sidebar-item ${isActive ? 'active' : ''}`
            }
            title={collapsed ? label : undefined}
          >
            <Icon size={18} style={{ flexShrink: 0 }} />
            {!collapsed && <span className="sidebar-item-label">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="sidebar-bottom">
        {/* Toggle button */}
        <button
          className="sidebar-item"
          onClick={onToggle}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          style={{ marginBottom: '4px' }}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          {!collapsed && <span className="sidebar-item-label">Collapse</span>}
        </button>

        {/* Logout */}
        <button
          className="sidebar-item"
          onClick={handleLogout}
          title="Logout"
        >
          <LogOut size={18} style={{ flexShrink: 0 }} />
          {!collapsed && <span className="sidebar-item-label">Logout</span>}
        </button>
      </div>
    </aside>
  );
}
