// Victory GamePlan V2 — StatCard component
export default function StatCard({ label, value, sub, accent, icon }) {
  return (
    <div style={{
      background: '#111827',
      border: '1px solid #1E293B',
      borderRadius: 12,
      padding: '20px 18px',
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        {icon && <span style={{ fontSize: 16 }}>{icon}</span>}
        <span style={{ fontSize: 12, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {label}
        </span>
      </div>
      <div style={{ fontSize: 30, fontWeight: 800, color: accent || '#F9FAFB', lineHeight: 1.1 }}>
        {value ?? '—'}
      </div>
      {sub && (
        <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{sub}</div>
      )}
    </div>
  );
}
