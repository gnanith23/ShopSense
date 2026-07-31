import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, Pencil, Trash2, Package } from 'lucide-react';
import api from '../../api/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import ConfirmDialog from '../../components/ConfirmDialog';

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', minimumFractionDigits: 2
  }).format(amount || 0);
}

function StockBadge({ stock }) {
  if (stock === 0) {
    return (
      <span style={{
        background: '#FEE2E2', color: '#DC2626',
        padding: '3px 8px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600,
        display: 'inline-flex', alignItems: 'center', gap: '0.25rem'
      }}>
        ❌ Out of Stock
      </span>
    );
  }
  if (stock < 5) {
    return (
      <span style={{
        background: '#FEF3C7', color: '#D97706',
        padding: '3px 8px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600,
        display: 'inline-flex', alignItems: 'center', gap: '0.25rem'
      }}>
        ⚠ Low Stock ({stock})
      </span>
    );
  }
  return (
    <span style={{
      background: '#D1FAE5', color: '#059669',
      padding: '3px 8px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600,
      display: 'inline-flex', alignItems: 'center', gap: '0.25rem'
    }}>
      ✅ {stock} units
    </span>
  );
}


export default function ProductCatalog() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Delete dialog state
  const [deleteTarget, setDeleteTarget] = useState(null); // { id, name }
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    setLoading(true);
    try {
      // GET /api/products/my-products
      const res = await api.get('/products/my-products');
      setProducts(res.data.products || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load products.');
    } finally {
      setLoading(false);
    }
  }

  function openDeleteDialog(product) {
    setDeleteTarget({ id: product._id, name: product.name });
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      // DELETE /api/products/:id
      await api.delete(`/products/${deleteTarget.id}`);
      // Remove from local state without full refresh
      setProducts((prev) => prev.filter((p) => p._id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete product.');
    } finally {
      setDeleteLoading(false);
    }
  }

  if (loading) return <LoadingSpinner message="Loading your catalog..." />;

  if (error) {
    return (
      <div className="alert alert-error" style={{ maxWidth: 500 }}>
        {error}
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">My Catalog</h2>
          <p className="page-subtitle">{products.length} product{products.length !== 1 ? 's' : ''} listed</p>
        </div>
        <Link to="/vendor/products/add" className="btn btn-primary">
          <PlusCircle size={16} />
          Add Product
        </Link>
      </div>

      {/* Table card */}
      <div className="card">
        {products.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No products yet"
            description="Start building your catalog by adding your first product."
            action={
              <Link to="/vendor/products/add" className="btn btn-primary btn-sm">
                <PlusCircle size={14} /> Add Product
              </Link>
            }
          />
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
                {products.map((product) => (
                  <tr key={product._id}>
                    {/* Product cell with thumbnail */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
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
                          <div style={{ fontWeight: 600, color: '#0F172A', fontSize: '0.875rem' }}>
                            {product.name}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: 1 }}>
                            {product.description?.slice(0, 45)}{product.description?.length > 45 ? '…' : ''}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td>
                      <span style={{
                        background: '#F1F5F9', color: '#475569',
                        padding: '2px 8px', borderRadius: 4,
                        fontSize: '0.75rem', fontWeight: 500,
                      }}>
                        {product.category}
                      </span>
                    </td>

                    {/* Price */}
                    <td style={{ fontWeight: 600, color: '#0F172A' }}>
                      {formatCurrency(product.price)}
                    </td>

                    {/* Stock */}
                    <td>
                      <StockBadge stock={product.stock} />
                    </td>

                    {/* Actions */}
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <Link
                          to={`/vendor/products/${product._id}/edit`}
                          className="btn btn-secondary btn-sm"
                          title="Edit product"
                        >
                          <Pencil size={14} />
                          Edit
                        </Link>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => openDeleteDialog(product)}
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

      {/* Delete confirm dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Product"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        confirmVariant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleteLoading}
      />
    </div>
  );
}
