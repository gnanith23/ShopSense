import { PackageX } from 'lucide-react';

// EmptyState — shown when a table or list has no items
export default function EmptyState({
  icon: Icon = PackageX,
  title = 'No items found',
  description = 'Nothing to display here yet.',
  action,
}) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        <Icon size={24} color="#94A3B8" />
      </div>
      <p className="empty-state-title">{title}</p>
      <p className="empty-state-desc">{description}</p>
      {action && <div style={{ marginTop: '0.5rem' }}>{action}</div>}
    </div>
  );
}
