import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';

const PAGE_TITLES = {
  '/admin/dashboard': 'Dashboard',
  '/admin/vendors': 'Vendor Management',
};

function getTitleFromPath(pathname) {
  return PAGE_TITLES[pathname] || 'Admin Panel';
}

export default function AdminLayout() {
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
