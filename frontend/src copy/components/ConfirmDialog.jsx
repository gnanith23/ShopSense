import { AlertTriangle } from 'lucide-react';

// ConfirmDialog — modal confirmation before destructive actions
export default function ConfirmDialog({
  isOpen,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Confirm',
  confirmVariant = 'danger', // 'danger' | 'warning' | 'primary'
  onConfirm,
  onCancel,
  loading = false,
}) {
  if (!isOpen) return null;

  const btnClass =
    confirmVariant === 'danger' ? 'btn btn-danger' :
    confirmVariant === 'warning' ? 'btn btn-warning' :
    'btn btn-primary';

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        {/* Icon + title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <div style={{
            width: 36, height: 36,
            background: confirmVariant === 'danger' ? '#FEE2E2' : '#FEF3C7',
            borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <AlertTriangle
              size={18}
              color={confirmVariant === 'danger' ? '#DC2626' : '#D97706'}
            />
          </div>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#0F172A' }}>
            {title}
          </h3>
        </div>

        {/* Message */}
        {message && (
          <p style={{ fontSize: '0.875rem', color: '#64748B', margin: '0 0 1.25rem 0' }}>
            {message}
          </p>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className={`${btnClass} btn-sm`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
                Processing...
              </>
            ) : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
