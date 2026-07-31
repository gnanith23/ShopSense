import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';
import api from '../../api/api';

// Fields based on Product.js model:
// name (required), description (required), category (required),
// price (required, number), stock (number), imageUrl (string)
// aiTags and seoKeywords are future AI features — NOT included in form

const INITIAL_FORM = {
  name: '',
  description: '',
  category: '',
  price: '',
  stock: '',
  imageUrl: '',
};

export default function AddProduct() {
  const navigate = useNavigate();
  const [form, setForm] = useState(INITIAL_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    setError('');
  }

  function validate() {
    const errors = {};
    if (!form.name.trim()) errors.name = 'Product name is required.';
    if (!form.description.trim()) errors.description = 'Description is required.';
    if (!form.category.trim()) errors.category = 'Category is required.';
    if (!form.price) {
      errors.price = 'Price is required.';
    } else if (isNaN(Number(form.price)) || Number(form.price) < 0) {
      errors.price = 'Price must be a valid non-negative number.';
    }
    if (form.stock !== '' && (!Number.isInteger(Number(form.stock)) || Number(form.stock) < 0)) {
      errors.stock = 'Stock must be a non-negative whole number.';
    }
    return errors;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);

    try {
      // POST /api/products — vendor ID comes from JWT, DO NOT send it manually
      await api.post('/products', {
        name: form.name.trim(),
        description: form.description.trim(),
        category: form.category.trim(),
        price: Number(form.price),
        stock: form.stock !== '' ? Number(form.stock) : 0,
        imageUrl: form.imageUrl.trim(),
      });

      setSuccess(true);
      // Brief success flash, then redirect to catalog
      setTimeout(() => {
        navigate('/vendor/catalog');
      }, 1200);

    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create product.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 640 }}>
      {/* Page header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 className="page-title">Add New Product</h2>
        <p className="page-subtitle">Fill in the details below to list a new product in your catalog.</p>
      </div>

      <div className="card">
        <div className="card-body">
          {/* Success message */}
          {success && (
            <div className="alert alert-success" style={{ marginBottom: '1rem' }}>
              <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
              <span>Product created successfully! Redirecting to catalog...</span>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-grid" style={{ gap: '1.125rem' }}>

              {/* Product Name */}
              <div className="form-group">
                <label className="form-label" htmlFor="p-name">
                  Product Name <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  id="p-name" name="name" type="text"
                  className={`form-input ${fieldErrors.name ? 'error' : ''}`}
                  placeholder="e.g. Wireless Bluetooth Headphones"
                  value={form.name} onChange={handleChange} disabled={loading}
                />
                {fieldErrors.name && <span className="form-error">{fieldErrors.name}</span>}
              </div>

              {/* Description */}
              <div className="form-group">
                <label className="form-label" htmlFor="p-description">
                  Description <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <textarea
                  id="p-description" name="description"
                  className={`form-input form-textarea ${fieldErrors.description ? 'error' : ''}`}
                  placeholder="Describe your product clearly..."
                  value={form.description} onChange={handleChange} disabled={loading}
                />
                {fieldErrors.description && (
                  <span className="form-error">{fieldErrors.description}</span>
                )}
              </div>

              {/* Category */}
              <div className="form-group">
                <label className="form-label" htmlFor="p-category">
                  Category <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  id="p-category" name="category" type="text"
                  className={`form-input ${fieldErrors.category ? 'error' : ''}`}
                  placeholder="e.g. Electronics, Clothing, Home & Garden"
                  value={form.category} onChange={handleChange} disabled={loading}
                />
                {fieldErrors.category && <span className="form-error">{fieldErrors.category}</span>}
              </div>

              {/* Price + Stock row */}
              <div className="form-grid form-grid-2" style={{ gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="p-price">
                    Price (USD) <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    id="p-price" name="price" type="number" min="0" step="0.01"
                    className={`form-input ${fieldErrors.price ? 'error' : ''}`}
                    placeholder="0.00"
                    value={form.price} onChange={handleChange} disabled={loading}
                  />
                  {fieldErrors.price && <span className="form-error">{fieldErrors.price}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="p-stock">
                    Stock Quantity
                  </label>
                  <input
                    id="p-stock" name="stock" type="number" min="0" step="1"
                    className={`form-input ${fieldErrors.stock ? 'error' : ''}`}
                    placeholder="0"
                    value={form.stock} onChange={handleChange} disabled={loading}
                  />
                  {fieldErrors.stock && <span className="form-error">{fieldErrors.stock}</span>}
                </div>
              </div>

              {/* Image URL */}
              <div className="form-group">
                <label className="form-label" htmlFor="p-imageUrl">
                  Image URL <span style={{ color: '#94A3B8', fontSize: '0.8125rem' }}>(optional)</span>
                </label>
                <input
                  id="p-imageUrl" name="imageUrl" type="url"
                  className="form-input"
                  placeholder="https://example.com/product-image.jpg"
                  value={form.imageUrl} onChange={handleChange} disabled={loading}
                />
                <span className="form-hint">Paste a direct image URL to display a product photo.</span>
              </div>

              {/* AI Features note */}
              <div className="alert alert-info" style={{ alignItems: 'flex-start' }}>
                <Info size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                <div>
                  <strong>AI Features Coming Soon</strong>
                  <p style={{ margin: '4px 0 0', fontSize: '0.8125rem' }}>
                    AI Tags and SEO Keywords will be auto-generated by AI when this feature launches.
                    You do not need to add them manually.
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.25rem' }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading || success}
                >
                  {loading ? (
                    <><span className="spinner" />Creating...</>
                  ) : 'Create Product'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => navigate('/vendor/catalog')}
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>

            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
