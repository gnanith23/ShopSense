import { Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

function getInitials(name = '') {
  return name
    .split(' ')
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() || '')
    .join('');
}

export default function Topbar({ title, onMenuToggle }) {
  const { user, role } = useAuth();

  const displayName = user?.name || 'User';
  const subLabel = role === 'vendor' ? user?.businessName : 'Administrator';

  return (
    <header className="topbar">
      {/* Mobile menu toggle */}
      <button
        className="btn btn-ghost btn-sm"
        onClick={onMenuToggle}
        style={{ display: 'none' }}
        id="mobile-menu-btn"
      >
        <Menu size={18} />
      </button>

      {/* Page title */}
      <div style={{ flex: 1 }}>
        <h1 style={{
          fontSize: '1rem',
          fontWeight: 700,
          color: '#0F172A',
          margin: 0,
        }}>
          {title}
        </h1>
      </div>

      {/* User info */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
      }}>
        {/* Role badge */}
        <span style={{
          fontSize: '0.6875rem',
          fontWeight: 600,
          padding: '3px 8px',
          borderRadius: '9999px',
          background: role === 'admin' ? '#EDE9FE' : '#EEF2FF',
          color: role === 'admin' ? '#5B21B6' : '#3730A3',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}>
          {role === 'admin' ? 'Admin' : 'Vendor'}
        </span>

        {/* User name + business/role */}
        <div style={{ textAlign: 'right', lineHeight: 1.3 }}>
          <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A' }}>
            {displayName}
          </div>
          {subLabel && (
            <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
              {subLabel}
            </div>
          )}
        </div>

        {/* Avatar */}
        <div className="avatar">
          {getInitials(displayName)}
        </div>
      </div>
    </header>
  );
}
