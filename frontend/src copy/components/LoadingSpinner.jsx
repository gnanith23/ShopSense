// LoadingSpinner — centered loading state for async data fetching
export default function LoadingSpinner({ message = 'Loading...' }) {
  return (
    <div className="loading-page">
      <div className="spinner spinner-dark" style={{ width: 28, height: 28, borderWidth: 3 }} />
      <span style={{ fontSize: '0.875rem', color: '#64748B' }}>{message}</span>
    </div>
  );
}
