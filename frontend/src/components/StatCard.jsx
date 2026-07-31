// StatCard — displays a single metric with icon, value, and label

export default function StatCard({ icon: Icon, label, value, iconBg, iconColor }) {
  return (
    <div className="stat-card">
      <div
        className="stat-icon-wrapper"
        style={{ background: iconBg || '#EEF2FF' }}
      >
        <Icon size={20} color={iconColor || '#4F46E5'} />
      </div>
      <div>
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}
