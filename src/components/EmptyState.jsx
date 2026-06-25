// Victory GamePlan V2 — EmptyState component
export default function EmptyState({ icon = '🎳', title, message, action }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '60px 24px',
      textAlign: 'center',
      gap: 16,
    }}>
      <div style={{ fontSize: 48 }}>{icon}</div>
      {title && (
        <div style={{ fontSize: 18, fontWeight: 700, color: '#F9FAFB' }}>{title}</div>
      )}
      <div style={{ fontSize: 14, color: '#9CA3AF', maxWidth: 360, lineHeight: 1.6 }}>
        {message}
      </div>
      {action && (
        <button
          onClick={action.onClick}
          style={{
            marginTop: 8,
            background: '#F59E0B',
            color: '#0B1220',
            border: 'none',
            borderRadius: 8,
            padding: '12px 28px',
            fontWeight: 700,
            fontSize: 15,
            cursor: 'pointer',
          }}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
