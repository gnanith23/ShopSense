// StatusBadge — renders a colored badge for vendor or transaction status

const STATUS_CONFIG = {
  PENDING:   { className: 'badge badge-pending',   dot: '#D97706' },
  APPROVED:  { className: 'badge badge-approved',  dot: '#059669' },
  SUSPENDED: { className: 'badge badge-suspended', dot: '#DC2626' },
  COMPLETED: { className: 'badge badge-completed', dot: '#2563EB' },
  CANCELLED: { className: 'badge badge-cancelled', dot: '#6B7280' },
};

export default function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.CANCELLED;

  return (
    <span className={config.className}>
      <span style={{
        width: 6,
        height: 6,
        borderRadius: '50%',
        background: config.dot,
        display: 'inline-block',
        flexShrink: 0,
      }} />
      {status}
    </span>
  );
}
