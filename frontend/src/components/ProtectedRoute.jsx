import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Redirects unauthenticated users to /login.
// Optionally checks for a specific role.
export default function ProtectedRoute({ children, requiredRole }) {
  const { isAuthenticated, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-page">
        <div className="spinner spinner-dark" />
        <span>Loading...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && role !== requiredRole) {
    // Wrong role — send to their correct dashboard
    if (role === 'customer') {
      return <Navigate to="/marketplace" replace />;
    }
    return <Navigate to={role === 'admin' ? '/admin/dashboard' : '/vendor/dashboard'} replace />;
  }

  return children;
}

