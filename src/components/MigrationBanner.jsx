// Victory GamePlan V3 — V2 localStorage migration banner
import { useState, useEffect } from 'react'
import { V2_STORAGE_KEY, MIGRATION_DISMISSED_KEY, migrateV2Sessions } from '../utils/db'

export default function MigrationBanner({ onMigrated }) {
  const [visible, setVisible] = useState(false)
  const [v2Count, setV2Count] = useState(0)
  const [state, setState] = useState('idle') // idle | loading | done | error
  const [imported, setImported] = useState(0)

  useEffect(() => {
    if (localStorage.getItem(MIGRATION_DISMISSED_KEY)) return
    try {
      const raw = localStorage.getItem(V2_STORAGE_KEY)
      if (!raw) return
      const data = JSON.parse(raw)
      if (Array.isArray(data) && data.length) {
        setV2Count(data.length)
        setVisible(true)
      }
    } catch {
      // malformed data — ignore
    }
  }, [])

  if (!visible) return null

  const handleImport = async () => {
    setState('loading')
    try {
      const raw = localStorage.getItem(V2_STORAGE_KEY)
      const v2Sessions = JSON.parse(raw)
      const { successCount } = await migrateV2Sessions(v2Sessions)
      setImported(successCount)
      setState('done')
      localStorage.removeItem(V2_STORAGE_KEY)
      localStorage.setItem(MIGRATION_DISMISSED_KEY, '1')
      if (onMigrated) onMigrated()
    } catch (err) {
      console.error('V2 migration error:', err)
      setState('error')
    }
  }

  const handleDismiss = () => {
    localStorage.setItem(MIGRATION_DISMISSED_KEY, '1')
    setVisible(false)
  }

  if (state === 'done') {
    return (
      <div style={{ ...banner, borderColor: '#10B981', background: '#064E3B22' }}>
        <span style={{ fontSize: 20 }}>✅</span>
        <span style={{ flex: 1, color: '#6EE7B7', fontSize: 14 }}>
          Imported {imported} session{imported !== 1 ? 's' : ''} from your old app. All your data is now in the cloud!
        </span>
      </div>
    )
  }

  if (state === 'error') {
    return (
      <div style={{ ...banner, borderColor: '#EF4444', background: '#7F1D1D22' }}>
        <span style={{ fontSize: 18 }}>❌</span>
        <span style={{ flex: 1, color: '#FCA5A5', fontSize: 14 }}>
          Import failed. Your old data is still saved on this device. Try again.
        </span>
        <button onClick={handleImport} style={btnSmall}>Retry</button>
      </div>
    )
  }

  return (
    <div style={banner}>
      <span style={{ fontSize: 20 }}>📦</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, color: '#F9FAFB', fontSize: 14 }}>
          Import your existing sessions
        </div>
        <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>
          Found {v2Count} session{v2Count !== 1 ? 's' : ''} from the previous app saved on this device.
        </div>
      </div>
      <button onClick={handleDismiss} style={{ ...btnSmall, background: 'transparent', color: '#6B7280', border: '1px solid #374151' }}>
        Skip
      </button>
      <button onClick={handleImport} disabled={state === 'loading'} style={btnSmall}>
        {state === 'loading' ? 'Importing…' : 'Import'}
      </button>
    </div>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const banner = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  background: '#111827',
  border: '1px solid #F59E0B55',
  borderRadius: 10,
  padding: '12px 16px',
  marginBottom: 20,
  flexWrap: 'wrap',
}

const btnSmall = {
  background: '#F59E0B',
  color: '#0B1220',
  border: 'none',
  borderRadius: 6,
  padding: '6px 14px',
  fontWeight: 700,
  fontSize: 13,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  fontFamily: 'inherit',
}
