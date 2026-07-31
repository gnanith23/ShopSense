import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  TrendingUp, DollarSign, ShoppingCart, Package, PlusCircle, ArrowRight, Pencil, Trash2
} from 'lucide-react';
import api from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import StatCard from '../../components/StatCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import ConfirmDialog from '../../components/ConfirmDialog';

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount || 0);
}

export default function VendorDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [analytics, setAnalytics] = useState(null);
  const [productCount, setProductCount] = useState(0);
  const [recentProducts, setRecentProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    fetchDashboardData();
  }, [user]);

  async function fetchDashboardData() {
    setLoading(true);
    try {
      const [analyticsRes, productsRes] = await Promise.all([
        api.get(`/vendors/${user.id}/analytics`),
        api.get('/products/my-products'),
      ]);

      setAnalytics(analyticsRes.data.analytics);
      const products = productsRes.data.products || [];
      setProductCount(products.length);
      setRecentProducts(products.slice(0, 5));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteProduct() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/products/${deleteTarget.id}`);
      setRecentProducts((prev) => prev.filter((p) => p._id !== deleteTarget.id));
      setProductCount((prev) => Math.max(0, prev - 1));
      setDeleteTarget(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete product.');
    } finally {
      setDeleteLoading(false);
    }
  }

  if (loading) return <LoadingSpinner message="Loading dashboard..." />;

  if (error) {
    return (
      <div className="alert alert-error" style={{ maxWidth: 500 }}>
        {error}
      </div>
    );
  }

  const statCards = [
    {
      label: 'Total Sales',
      value: analytics?.totalSales ?? 0,
      icon: TrendingUp,
      iconBg: '#EEF2FF',
      iconColor: '#4F46E5',
    },
    {
      label: 'Total Revenue',
      value: formatCurrency(analytics?.totalRevenue),
      icon: DollarSign,
      iconBg: '#F0FDF4',
      iconColor: '#059669',
    },
    {
      label: 'Total Transactions',
      value: analytics?.totalTransactions ?? 0,
      icon: ShoppingCart,
      iconBg: '#FFF7ED',
      iconColor: '#EA580C',
    },
    {
      label: 'Products Listed',
      value: productCount,
      icon: Package,
      iconBg: '#F0F9FF',
      iconColor: '#0284C7',
    },
  ];

  return (
    <div>
      {/* Welcome banner */}
      <div style={{
        background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
        borderRadius: 12,
        padding: '1.25rem 1.5rem',
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.0625rem', fontWeight: 700, color: 'white' }}>
            Welcome back, {user?.name?.split(' ')[0]}!
          </h2>
          <p style={{ margin: '3px 0 0', fontSize: '0.875rem', color: 'rgba(255,255,255,0.75)' }}>
            {user?.businessName} · Here's your business overview
          </p>
        </div>
        <Link to="/vendor/products/add" className="btn btn-secondary btn-sm">
          <PlusCircle size={15} />
          Add Product
        </Link>
      </div>

      {/* Stat cards */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        {statCards.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>

      {/* Recent products */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 600, color: '#0F172A' }}>
              Recent Products
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: '0.8125rem', color: '#64748B' }}>
              Your {recentProducts.length} most recently added products
            </p>
          </div>
          <Link to="/vendor/catalog" className="btn btn-ghost btn-sm">
            View all <ArrowRight size={14} />
          </Link>
        </div>

        {recentProducts.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <p style={{ color: '#94A3B8', fontSize: '0.875rem' }}>
              No products yet.{' '}
              <Link to="/vendor/products/add" style={{ color: '#4F46E5', fontWeight: 500 }}>
                Add your first product
              </Link>
            </p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentProducts.map((product) => (
                  <tr key={product._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="product-image-thumb"
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        ) : (
                          <div className="product-image-placeholder">
                            <Package size={16} />
                          </div>
                        )}
                        <div>
                          <div style={{ fontWeight: 500, color: '#0F172A' }}>{product.name}</div>
                          <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                            {product.description?.slice(0, 40)}...
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{
                        background: '#F1F5F9', color: '#475569',
                        padding: '2px 8px', borderRadius: 4,
                        fontSize: '0.75rem', fontWeight: 500,
                      }}>
                        {product.category}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{formatCurrency(product.price)}</td>
                    <td>{product.stock} units</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.375rem', justifyContent: 'flex-end' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => navigate(`/vendor/products/${product._id}/edit`)}
                          title="Edit product"
                        >
                          <Pencil size={14} />
                          Edit
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => setDeleteTarget({ id: product._id, name: product.name })}
                          title="Delete product"
                        >
                          <Trash2 size={14} />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation modal for product deletion */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Product"
        message={`Are you sure you want to delete "${deleteTarget?.name}"?`}
        confirmLabel="Delete"
        confirmVariant="danger"
        onConfirm={handleDeleteProduct}
        onCancel={() => setDeleteTarget(null)}
        loading={deleteLoading}
      />
    </div>
  );
}
