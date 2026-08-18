import { useState, useEffect } from 'react';
import {
  TrendingUp,
  Package,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Info,
  ChevronDown,
  Activity,
  ShieldCheck,
  Calendar,
  Layers,
} from 'lucide-react';
import api from '../api/api';
import ForecastChart from './ForecastChart';

// InventoryForecast — Milestone 2 Advanced Feature Component
// Consumes GET /api/forecast/product/:productId?horizon=N and GET /api/forecast/products
// Renders demand forecasts, restock recommendations, daily predictions, model parameters & validation.

export default function InventoryForecast() {
  // Vendor product catalog list
  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedHorizon, setSelectedHorizon] = useState(7);

  // Single product forecast data
  const [forecastData, setForecastData] = useState(null);
  const [forecastLoading, setForecastLoading] = useState(false);
  const [forecastError, setForecastError] = useState('');

  // Vendor-wide products summary forecast
  const [vendorForecast, setVendorForecast] = useState(null);
  const [vendorForecastLoading, setVendorForecastLoading] = useState(false);

  // Load vendor's products on mount
  useEffect(() => {
    fetchVendorProducts();
  }, []);

  // Fetch single forecast whenever product or horizon changes
  useEffect(() => {
    if (selectedProductId) {
      fetchProductForecast(selectedProductId, selectedHorizon);
    }
  }, [selectedProductId, selectedHorizon]);

  // Fetch vendor-wide product forecast summary
  useEffect(() => {
    fetchVendorSummaryForecast(selectedHorizon);
  }, [selectedHorizon]);

  async function fetchVendorProducts() {
    try {
      const res = await api.get('/products/my-products');
      const prods = res.data.products || [];
      setProducts(prods);
      if (prods.length > 0) {
        setSelectedProductId(prods[0]._id);
      }
    } catch (err) {
      console.error('Failed to load products for forecast:', err.message);
    }
  }

  async function fetchProductForecast(productId, horizon) {
    setForecastLoading(true);
    setForecastError('');
    setForecastData(null);
    try {
      const res = await api.get(`/forecast/product/${productId}?horizon=${horizon}`);
      setForecastData(res.data);
    } catch (err) {
      setForecastError(err.response?.data?.message || 'Unable to generate demand forecast.');
    } finally {
      setForecastLoading(false);
    }
  }

  async function fetchVendorSummaryForecast(horizon) {
    setVendorForecastLoading(true);
    try {
      const res = await api.get(`/forecast/products?horizon=${horizon}&limit=20`);
      setVendorForecast(res.data);
    } catch (err) {
      console.error('Failed to load vendor summary forecast:', err.message);
    } finally {
      setVendorForecastLoading(false);
    }
  }

  const isInsufficient = forecastData?.status === 'INSUFFICIENT_DATA';
  const isSuccess = forecastData?.status === 'SUCCESS';
  const restock = forecastData?.restock;
  const forecast = forecastData?.forecast;
  const model = forecastData?.model;
  const validation = forecastData?.validation;
  const historical = forecastData?.historicalSummary;

  return (
    <div className="card" style={{ marginBottom: '1.5rem' }}>
      {/* Header */}
      <div className="card-header" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <TrendingUp size={18} color="#4F46E5" />
          <div>
            <h3 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 600, color: '#0F172A' }}>
              ML Inventory Demand Forecasting
            </h3>
            <p style={{ margin: '1px 0 0', fontSize: '0.8125rem', color: '#64748B' }}>
              Time-series ARIMA demand predictions & automated restock recommendations
            </p>
          </div>
        </div>

        <span style={{
          background: '#EEF2FF', color: '#4F46E5',
          border: '1px solid #C7D2FE',
          padding: '3px 10px', borderRadius: 20,
          fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.03em',
          whiteSpace: 'nowrap',
        }}>
          📈 Time-Series ML Model
        </span>
      </div>

      <div className="card-body">
        {/* Controls: Product Dropdown & Horizon Selector */}
        {products.length === 0 ? (
          <div className="alert alert-info" style={{ alignItems: 'flex-start' }}>
            <Info size={16} style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <strong>No products in catalog</strong>
              <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: '#1E40AF' }}>
                Add products to your catalog to generate machine learning demand forecasts.
              </p>
            </div>
          </div>
        ) : (
          <div style={{
            display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between',
            gap: '1rem', padding: '1rem', borderRadius: 10,
            background: '#F8FAFC', border: '1px solid #E2E8F0',
            marginBottom: '1.25rem',
          }}>
            {/* Product Selector */}
            <div style={{ flex: 1, minWidth: 220 }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>
                SELECT PRODUCT
              </label>
              <div style={{ position: 'relative' }}>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  style={{
                    width: '100%', appearance: 'none', background: 'white',
                    border: '1px solid #CBD5E1', borderRadius: 8,
                    padding: '0.5rem 2.25rem 0.5rem 0.875rem',
                    fontSize: '0.875rem', fontWeight: 500, color: '#0F172A',
                    cursor: 'pointer', fontFamily: 'inherit', outline: 'none',
                  }}
                >
                  {products.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} ({p.category}) — Stock: {p.stock}
                    </option>
                  ))}
                </select>
                <ChevronDown size={15} color="#64748B" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              </div>
            </div>

            {/* Horizon Selector */}
            <div style={{ minWidth: 140 }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>
                FORECAST HORIZON
              </label>
              <div style={{ position: 'relative' }}>
                <select
                  value={selectedHorizon}
                  onChange={(e) => setSelectedHorizon(Number(e.target.value))}
                  style={{
                    width: '100%', appearance: 'none', background: 'white',
                    border: '1px solid #CBD5E1', borderRadius: 8,
                    padding: '0.5rem 2.25rem 0.5rem 0.875rem',
                    fontSize: '0.875rem', fontWeight: 500, color: '#0F172A',
                    cursor: 'pointer', fontFamily: 'inherit', outline: 'none',
                  }}
                >
                  <option value={7}>7 Days</option>
                  <option value={14}>14 Days</option>
                  <option value={30}>30 Days</option>
                </select>
                <ChevronDown size={15} color="#64748B" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              </div>
            </div>

            {/* Manual Refresh Button */}
            <div style={{ alignSelf: 'flex-end' }}>
              <button
                onClick={() => fetchProductForecast(selectedProductId, selectedHorizon)}
                className="btn btn-secondary btn-sm"
                style={{ padding: '0.5rem 0.875rem', height: 38 }}
                title="Refresh Forecast"
              >
                <RefreshCw size={13} />
                Refresh
              </button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {forecastLoading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748B', fontSize: '0.875rem', padding: '1.5rem 0' }}>
            <div className="spinner spinner-dark" style={{ width: 18, height: 18, borderWidth: 2 }} />
            Generating machine learning demand forecast...
          </div>
        )}

        {/* Error State */}
        {forecastError && !forecastLoading && (
          <div className="alert alert-error">
            {forecastError}
            <button
              onClick={() => fetchProductForecast(selectedProductId, selectedHorizon)}
              style={{ marginLeft: '0.5rem', background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626', padding: 0 }}
            >
              <RefreshCw size={13} />
            </button>
          </div>
        )}

        {/* Insufficient Data State */}
        {!forecastLoading && isInsufficient && (
          <div style={{
            padding: '1.25rem', borderRadius: 10,
            background: '#FFFBEB', border: '1px solid #FDE68A',
            marginBottom: '1rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
              <Info size={20} color="#D97706" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <h4 style={{ margin: '0 0 0.25rem', fontSize: '0.9375rem', fontWeight: 600, color: '#B45309' }}>
                  📊 Forecast Unavailable — Insufficient Sales History
                </h4>
                <p style={{ margin: 0, fontSize: '0.8125rem', color: '#92400E' }}>
                  {forecastData.message || 'Not enough historical sales data is available to generate a reliable forecast for this product.'}
                </p>
                <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: '#78350F', display: 'flex', gap: '1rem' }}>
                  <span>Available observations: <strong>{forecastData.availableObservations ?? 0}</strong></span>
                  <span>Required minimum: <strong>{forecastData.requiredMinimum ?? 5}</strong></span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Success Forecast Display */}
        {!forecastLoading && isSuccess && forecastData && (
          <div>
            {/* Restock Recommendation Alert Banner */}
            {restock?.recommended ? (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '1rem 1.25rem', borderRadius: 10,
                background: '#FFF1F2', border: '1px solid #FECDD3',
                marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                  <AlertTriangle size={20} color="#DC2626" />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#991B1B' }}>
                      ⚠ Restock Recommended
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: '#B91C1C', marginTop: 1 }}>
                      {restock.explanation}
                    </div>
                  </div>
                </div>
                <div style={{
                  background: '#DC2626', color: 'white',
                  padding: '6px 14px', borderRadius: 8,
                  fontWeight: 700, fontSize: '0.875rem',
                }}>
                  Restock +{restock.recommendedQuantity} units
                </div>
              </div>
            ) : (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.625rem',
                padding: '0.875rem 1.25rem', borderRadius: 10,
                background: '#F0FDF4', border: '1px solid #BBF7D0',
                marginBottom: '1.25rem', fontSize: '0.875rem', color: '#166534',
              }}>
                <CheckCircle size={18} color="#059669" />
                <span>
                  <strong>✓ Stock Level Looks Sufficient:</strong> {restock?.explanation || 'Current stock covers expected demand.'}
                </span>
              </div>
            )}

            {/* 4 Forecast Metric Stat Cards */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '0.875rem', marginBottom: '1.5rem',
            }}>
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: '0.875rem' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 500 }}>CURRENT STOCK</div>
                <div style={{ fontSize: '1.375rem', fontWeight: 700, color: '#0F172A', marginTop: 2 }}>
                  {forecastData.product.currentStock} units
                </div>
              </div>
              <div style={{ background: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: 10, padding: '0.875rem' }}>
                <div style={{ fontSize: '0.75rem', color: '#4338CA', fontWeight: 500 }}>PREDICTED DEMAND</div>
                <div style={{ fontSize: '1.375rem', fontWeight: 700, color: '#4F46E5', marginTop: 2 }}>
                  {forecast.totalPredictedDemand} units
                </div>
                <div style={{ fontSize: '0.7rem', color: '#6366F1', marginTop: 1 }}>
                  ~{forecast.averageDailyDemand} units/day
                </div>
              </div>
              <div style={{ background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 10, padding: '0.875rem' }}>
                <div style={{ fontSize: '0.75rem', color: '#C2410C', fontWeight: 500 }}>SAFETY BUFFER (10%)</div>
                <div style={{ fontSize: '1.375rem', fontWeight: 700, color: '#EA580C', marginTop: 2 }}>
                  +{forecast.safetyBufferUnits} units
                </div>
              </div>
              <div style={{
                background: restock?.recommended ? '#FFF1F2' : '#F0FDF4',
                border: `1px solid ${restock?.recommended ? '#FECDD3' : '#BBF7D0'}`,
                borderRadius: 10, padding: '0.875rem',
              }}>
                <div style={{ fontSize: '0.75rem', color: restock?.recommended ? '#991B1B' : '#166534', fontWeight: 500 }}>
                  RECOMMENDED RESTOCK
                </div>
                <div style={{ fontSize: '1.375rem', fontWeight: 700, color: restock?.recommended ? '#DC2626' : '#059669', marginTop: 2 }}>
                  {restock?.recommendedQuantity || 0} units
                </div>
              </div>
            </div>

            {/* Chart + Daily Forecast Table */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '1.25rem', marginBottom: '1.5rem', alignItems: 'stretch' }}>
              {/* SVG Demand Chart */}
              <div>
                <ForecastChart
                  dailyForecast={forecastData.dailyForecast}
                  historicalSummary={historical}
                />
              </div>

              {/* Daily Predictions Breakdown Table */}
              <div style={{ background: '#F8FAFC', borderRadius: 10, padding: '1rem', border: '1px solid #E2E8F0', overflowY: 'auto', maxHeight: 250 }}>
                <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <Calendar size={14} color="#6366F1" /> Daily Breakdown
                </div>
                <table style={{ width: '100%', fontSize: '0.78rem', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #CBD5E1', color: '#64748B', textAlign: 'left' }}>
                      <th style={{ padding: '4px 0' }}>Date</th>
                      <th style={{ padding: '4px 0', textAlign: 'right' }}>Forecast</th>
                    </tr>
                  </thead>
                  <tbody>
                    {forecastData.dailyForecast.map((d) => (
                      <tr key={d.date} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '5px 0', color: '#475569' }}>
                          {new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </td>
                        <td style={{ padding: '5px 0', textAlign: 'right', fontWeight: 700, color: '#4F46E5' }}>
                          {d.predictedDemand} units
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Model Metadata & Validation Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
              {/* Model Card */}
              <div style={{ padding: '1rem', borderRadius: 10, background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem', fontWeight: 600, color: '#0F172A', marginBottom: '0.5rem' }}>
                  <Layers size={15} color="#4F46E5" /> Forecast Model Metadata
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.78rem', color: '#475569' }}>
                  <div>Model Name: <strong style={{ color: '#0F172A' }}>{model?.name || 'ARIMA'}</strong></div>
                  <div>Type: <span>{model?.type || 'Time-Series'}</span></div>
                  <div>Historical Observations: <span>{historical?.availableObservations || 0} days</span></div>
                  <div>Total Historical Sales: <span>{historical?.totalHistoricalUnits || 0} units</span></div>
                  {historical?.startDate && <div>Date Range: <span>{historical.startDate} to {historical.endDate}</span></div>}
                </div>
              </div>

              {/* Validation Card */}
              <div style={{ padding: '1rem', borderRadius: 10, background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem', fontWeight: 600, color: '#0F172A', marginBottom: '0.5rem' }}>
                  <ShieldCheck size={15} color="#059669" /> Model Backtest Validation
                </div>
                {validation?.metrics ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.78rem', color: '#475569' }}>
                    <div>Validation Status: <strong style={{ color: '#059669' }}>{validation.status}</strong></div>
                    <div>Mean Absolute Error (MAE): <strong style={{ color: '#0F172A' }}>{validation.metrics.mae}</strong></div>
                    <div>Root Mean Squared Error (RMSE): <strong style={{ color: '#0F172A' }}>{validation.metrics.rmse}</strong></div>
                    <div style={{ fontSize: '0.7rem', color: '#94A3B8', marginTop: 2 }}>{validation.explanation}</div>
                  </div>
                ) : (
                  <div style={{ fontSize: '0.78rem', color: '#94A3B8' }}>
                    {validation?.explanation || 'Validation metrics unavailable for current sample size.'}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Optional Vendor Products Overview Table */}
        {vendorForecast?.forecasts && vendorForecast.forecasts.length > 0 && (
          <div style={{ marginTop: '2rem', borderTop: '1px solid #F1F5F9', paddingTop: '1.25rem' }}>
            <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.875rem', fontWeight: 600, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <Activity size={15} color="#4F46E5" /> Vendor Catalog Demand Forecast Overview ({selectedHorizon}-Day Horizon)
            </h4>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Current Stock</th>
                    <th>Predicted Demand</th>
                    <th>Safety Buffer</th>
                    <th>Restock Status</th>
                  </tr>
                </thead>
                <tbody>
                  {vendorForecast.forecasts.map((f, idx) => (
                    <tr key={f.product?.id || idx}>
                      <td style={{ fontWeight: 500, color: '#0F172A' }}>{f.product?.name}</td>
                      <td>{f.product?.currentStock} units</td>
                      <td style={{ fontWeight: 600, color: '#4F46E5' }}>
                        {f.status === 'SUCCESS' ? `${f.forecast.totalPredictedDemand} units` : '—'}
                      </td>
                      <td>
                        {f.status === 'SUCCESS' ? `+${f.forecast.safetyBufferUnits}` : '—'}
                      </td>
                      <td>
                        {f.status === 'INSUFFICIENT_DATA' ? (
                          <span style={{ fontSize: '0.73rem', background: '#FFFBEB', color: '#D97706', padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>
                            INSUFFICIENT DATA
                          </span>
                        ) : f.restock?.recommended ? (
                          <span style={{ fontSize: '0.73rem', background: '#FFF1F2', color: '#DC2626', padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>
                            ⚠ Restock +{f.restock.recommendedQuantity}
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.73rem', background: '#F0FDF4', color: '#059669', padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>
                            ✓ Sufficient
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
