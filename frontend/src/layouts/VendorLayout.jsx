import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import { useLocation } from 'react-router-dom';

// Maps route paths to human-readable page titles
const PAGE_TITLES = {
  '/vendor/dashboard': 'Dashboard',
  '/vendor/catalog': 'My Catalog',
  '/vendor/products/add': 'Add Product',
  '/vendor/analytics': 'Analytics',
  '/vendor/profile': 'Profile',
};

function getTitleFromPath(pathname) {
  // Handle dynamic routes like /vendor/products/:id/edit
  if (pathname.includes('/edit')) return 'Edit Product';
  return PAGE_TITLES[pathname] || 'Vendor Portal';
}

export default function VendorLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const title = getTitleFromPath(location.pathname);

  return (
    <div className="dashboard-layout">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((prev) => !prev)}
      />
      <div className={`main-content ${collapsed ? 'sidebar-collapsed' : ''}`}>
        <Topbar title={title} onMenuToggle={() => setCollapsed((prev) => !prev)} />
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
