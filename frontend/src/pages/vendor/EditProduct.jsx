import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';
import api from '../../api/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import AiseoScoreCard from '../../components/AiseoScoreCard';

export default function EditProduct() {
  const navigate = useNavigate();
  const { id } = useParams(); // product ID from URL

  const [form, setForm] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
    stock: '',
    imageUrl: '',
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiTags, setAiTags] = useState([]);
  const [seoKeywords, setSeoKeywords] = useState([]);

  // Load existing product data on mount
  useEffect(() => {
    async function fetchProduct() {
      try {
        // GET /api/products/:id (ownership checked by backend)
        const res = await api.get(`/products/${id}`);
        const p = res.data.product;
        setForm({
          name: p.name || '',
          description: p.description || '',
          category: p.category || '',
          price: p.price?.toString() || '',
          stock: p.stock?.toString() || '',
          imageUrl: p.imageUrl || '',
        });
        setAiTags(p.aiTags || []);
        setSeoKeywords(p.seoKeywords || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load product.');
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchProduct();
  }, [id]);

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

  async function handleGenerateAI() {
    if (!form.name.trim() || !form.category.trim()) {
      setError('Product Name and Category are required to generate AI content.');
      return;
    }

    setAiLoading(true);
    setError('');

    try {
      const response = await api.post('/ai/generate-product-content', {
        productName: form.name.trim(),
        category: form.category.trim()
      });

      setForm((prev) => ({
        ...prev,
        description: response.data.description
      }));
      setAiTags(response.data.aiTags || []);
      setSeoKeywords(response.data.seoKeywords || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate AI content.');
    } finally {
      setAiLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setSaving(true);
    try {
      // PUT /api/products/:id
      await api.put(`/products/${id}`, {
        name: form.name.trim(),
        description: form.description.trim(),
        category: form.category.trim(),
        price: Number(form.price),
        stock: form.stock !== '' ? Number(form.stock) : 0,
        imageUrl: form.imageUrl.trim(),
        aiTags,
        seoKeywords,
      });

      setSuccess(true);
      setTimeout(() => navigate('/vendor/catalog'), 1200);

    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update product.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingSpinner message="Loading product..." />;

  return (
    <div style={{ maxWidth: 640 }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 className="page-title">Edit Product</h2>
        <p className="page-subtitle">Update the details for this product.</p>
      </div>

      <div className="card">
        <div className="card-body">
          {success && (
            <div className="alert alert-success" style={{ marginBottom: '1rem' }}>
              <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
              <span>Product updated successfully! Redirecting...</span>
            </div>
          )}

          {error && (
            <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-grid" style={{ gap: '1.125rem' }}>

              <div className="form-group">
                <label className="form-label" htmlFor="ep-name">
                  Product Name <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  id="ep-name" name="name" type="text"
                  className={`form-input ${fieldErrors.name ? 'error' : ''}`}
                  value={form.name} onChange={handleChange} disabled={saving}
                />
                {fieldErrors.name && <span className="form-error">{fieldErrors.name}</span>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="ep-category">
                  Category <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  id="ep-category" name="category" type="text"
                  className={`form-input ${fieldErrors.category ? 'error' : ''}`}
                  value={form.category} onChange={handleChange} disabled={saving}
                />
                {fieldErrors.category && <span className="form-error">{fieldErrors.category}</span>}
              </div>

              {/* Generate AI Content Button */}
              <div>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleGenerateAI}
                  disabled={aiLoading || saving}
                >
                  {aiLoading ? 'Generating...' : '✨ Generate AI Content'}
                </button>
              </div>

              {/* AI SEO Score Card (Shows after generation or if exists) */}
              {(aiTags.length > 0 || seoKeywords.length > 0) && (
                <AiseoScoreCard 
                  productName={form.name}
                  category={form.category}
                  description={form.description}
                  aiTags={aiTags}
                  seoKeywords={seoKeywords}
                />
              )}

              <div className="form-group">
                <label className="form-label" htmlFor="ep-description">
                  Description <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <textarea
                  id="ep-description" name="description"
                  className={`form-input form-textarea ${fieldErrors.description ? 'error' : ''}`}
                  value={form.description} onChange={handleChange} disabled={saving}
                />
                {fieldErrors.description && (
                  <span className="form-error">{fieldErrors.description}</span>
                )}
              </div>

              <div className="form-grid form-grid-2" style={{ gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="ep-price">
                    Price (USD) <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    id="ep-price" name="price" type="number" min="0" step="0.01"
                    className={`form-input ${fieldErrors.price ? 'error' : ''}`}
                    value={form.price} onChange={handleChange} disabled={saving}
                  />
                  {fieldErrors.price && <span className="form-error">{fieldErrors.price}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="ep-stock">Stock Quantity</label>
                  <input
                    id="ep-stock" name="stock" type="number" min="0" step="1"
                    className={`form-input ${fieldErrors.stock ? 'error' : ''}`}
                    value={form.stock} onChange={handleChange} disabled={saving}
                  />
                  {fieldErrors.stock && <span className="form-error">{fieldErrors.stock}</span>}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="ep-imageUrl">
                  Image URL <span style={{ color: '#94A3B8', fontSize: '0.8125rem' }}>(optional)</span>
                </label>
                <input
                  id="ep-imageUrl" name="imageUrl" type="url"
                  className="form-input"
                  placeholder="https://example.com/product-image.jpg"
                  value={form.imageUrl} onChange={handleChange} disabled={saving}
                />
              </div>

              {/* AI Features note */}
              {aiTags.length === 0 && seoKeywords.length === 0 && (
                <div className="alert alert-info" style={{ alignItems: 'flex-start' }}>
                  <Info size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                  <div>
                    <strong>AI Features Available</strong>
                    <p style={{ margin: '4px 0 0', fontSize: '0.8125rem' }}>
                      Click "Generate AI Content" to auto-generate description, tags, and keywords.
                    </p>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.25rem' }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving || success}
                >
                  {saving ? (
                    <><span className="spinner" />Saving...</>
                  ) : 'Save Changes'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => navigate('/vendor/catalog')}
                  disabled={saving}
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
