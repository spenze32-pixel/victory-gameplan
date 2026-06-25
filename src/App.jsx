// Victory GamePlan V3 — Main App (Supabase-backed, auth-aware)
import { useState, useEffect, useCallback } from 'react'
import { supabase } from './lib/supabase'
import { getSessions, addSession, updateSession, deleteSession } from './utils/db'
import Auth from './components/Auth'
import MigrationBanner from './components/MigrationBanner'
import Dashboard from './components/Dashboard'
import SessionForm from './components/SessionForm'
import SessionHistory from './components/SessionHistory'
import SessionDetail from './components/SessionDetail'

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'add-session', label: 'Add Session', icon: '➕' },
  { id: 'history', label: 'History', icon: '📋' },
]

export default function App() {
  // ─── Auth state ───────────────────────────────────────────────────────────
  const [authLoading, setAuthLoading] = useState(true)
  const [user, setUser] = useState(null)

  // ─── App state ────────────────────────────────────────────────────────────
  const [view, setView] = useState('dashboard')
  const [sessions, setSessions] = useState([])
  const [dataLoading, setDataLoading] = useState(false)
  const [selectedSession, setSelectedSession] = useState(null)
  const [editingSession, setEditingSession] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  // ─── Auth listener ────────────────────────────────────────────────────────
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setAuthLoading(false)
    })

    // Listen for auth changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (!session?.user) {
        setSessions([])
        setView('dashboard')
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // ─── Load sessions when user signs in ────────────────────────────────────
  useEffect(() => {
    if (!user) return
    loadSessions()
  }, [user])

  const loadSessions = useCallback(async () => {
    setDataLoading(true)
    setError(null)
    try {
      const data = await getSessions()
      setSessions(data)
    } catch (err) {
      console.error('Failed to load sessions:', err)
      setError('Failed to load sessions. Check your connection and try again.')
    } finally {
      setDataLoading(false)
    }
  }, [])

  // ─── Navigation ───────────────────────────────────────────────────────────
  const navigate = useCallback((viewName, session = null) => {
    setView(viewName)
    setError(null)
    if (viewName !== 'session-detail') setSelectedSession(null)
    if (viewName !== 'edit-session') setEditingSession(null)
    if (viewName === 'session-detail' && session) setSelectedSession(session)
    if (viewName === 'edit-session' && session) setEditingSession(session)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  // ─── Session actions ──────────────────────────────────────────────────────
  const handleSave = async (session) => {
    setSaving(true)
    setError(null)
    try {
      const saved = await addSession(session)
      await loadSessions()
      navigate('session-detail', saved)
    } catch (err) {
      console.error('Save failed:', err)
      setError('Failed to save session. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdate = async (session) => {
    setSaving(true)
    setError(null)
    try {
      const updated = await updateSession(session.id, session)
      await loadSessions()
      navigate('session-detail', updated)
    } catch (err) {
      console.error('Update failed:', err)
      setError('Failed to update session. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (sessionId) => {
    setError(null)
    try {
      await deleteSession(sessionId)
      await loadSessions()
      if (selectedSession?.id === sessionId) navigate('history')
    } catch (err) {
      console.error('Delete failed:', err)
      setError('Failed to delete session. Please try again.')
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  const handleView = (session) => navigate('session-detail', session)
  const handleEdit = (session) => navigate('edit-session', session)
  const handleEditFromDetail = () => navigate('edit-session', selectedSession)

  // ─── Render: Loading ──────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div style={{ ...appWrapper, justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🎳</div>
          <div style={{ color: '#6B7280', fontSize: 14 }}>Loading Victory GamePlan…</div>
        </div>
      </div>
    )
  }

  // ─── Render: Auth screen ──────────────────────────────────────────────────
  if (!user) {
    return <Auth />
  }

  // ─── Render: Main app ─────────────────────────────────────────────────────
  const isMainTab = ['dashboard', 'add-session', 'history'].includes(view)

  const pageTitle = {
    dashboard: 'Dashboard',
    'add-session': 'Add Session',
    history: 'Session History',
    'session-detail': selectedSession?.bowlingCenter || 'Session Detail',
    'edit-session': 'Edit Session',
  }[view] || 'Victory GamePlan'

  const pageSub = {
    dashboard: 'Your bowling performance at a glance',
    'add-session': 'Log a new bowling session',
    history: 'All your logged sessions',
  }[view]

  return (
    <div style={appWrapper}>
      {/* Top Nav */}
      <header style={header}>
        <div style={headerInner}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 22 }}>🎳</span>
            <div>
              <div style={{ fontWeight: 900, fontSize: 17, color: '#F9FAFB', letterSpacing: '0.02em' }}>
                Victory GamePlan™
              </div>
              <div style={{ fontSize: 10, color: '#F59E0B', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Performance Journal
              </div>
            </div>
          </div>
          <button onClick={handleSignOut} style={signOutBtn} title="Sign out">
            <span style={{ fontSize: 16 }}>👤</span>
            <span style={{ fontSize: 11 }}>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Page Body */}
      <main style={mainContent}>
        <div style={contentInner}>

          {/* Migration banner — shows once if V2 data detected */}
          <MigrationBanner onMigrated={loadSessions} />

          {/* Global error */}
          {error && (
            <div style={errorBanner}>
              <span>{error}</span>
              <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: '#FCA5A5', cursor: 'pointer', fontSize: 16 }}>×</button>
            </div>
          )}

          {/* Page header */}
          <div style={{ marginBottom: isMainTab ? 24 : 20 }}>
            {!isMainTab && (
              <button onClick={() => navigate(view === 'edit-session' ? 'session-detail' : 'history')} style={backBtn}>
                ← Back
              </button>
            )}
            <div style={{ fontSize: 22, fontWeight: 800, color: '#F9FAFB' }}>{pageTitle}</div>
            {pageSub && <div style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>{pageSub}</div>}
          </div>

          {/* Data loading spinner */}
          {dataLoading && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#6B7280' }}>
              Loading your sessions…
            </div>
          )}

          {/* Views */}
          {!dataLoading && view === 'dashboard' && (
            <Dashboard sessions={sessions} onNavigate={navigate} />
          )}

          {!dataLoading && view === 'add-session' && (
            <SessionForm
              onSave={handleSave}
              onCancel={() => navigate('dashboard')}
              saving={saving}
            />
          )}

          {!dataLoading && view === 'history' && (
            <SessionHistory
              sessions={sessions}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onNavigate={navigate}
            />
          )}

          {view === 'session-detail' && selectedSession && (
            <SessionDetail
              session={selectedSession}
              onEdit={handleEditFromDetail}
              onBack={() => navigate('history')}
            />
          )}

          {view === 'edit-session' && editingSession && (
            <SessionForm
              editSession={editingSession}
              onSave={handleUpdate}
              onCancel={() => navigate('session-detail', editingSession)}
              saving={saving}
            />
          )}

        </div>
      </main>

      {/* Bottom Tab Nav */}
      <nav style={bottomNav}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => navigate(tab.id)}
            style={{
              ...tabBtn,
              ...(view === tab.id || (tab.id === 'add-session' && view === 'edit-session') ? tabBtnActive : {}),
            }}
          >
            <span style={{ fontSize: 20 }}>{tab.icon}</span>
            <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.04em' }}>{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const appWrapper = {
  minHeight: '100vh',
  background: '#0B1220',
  color: '#F9FAFB',
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  display: 'flex',
  flexDirection: 'column',
}

const header = {
  background: '#060D18',
  borderBottom: '1px solid #1E293B',
  position: 'sticky',
  top: 0,
  zIndex: 100,
}

const headerInner = {
  maxWidth: 1200,
  margin: '0 auto',
  padding: '12px 16px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
}

const mainContent = {
  flex: 1,
  paddingBottom: 90,
}

const contentInner = {
  maxWidth: 1200,
  margin: '0 auto',
  padding: '24px 16px',
}

const bottomNav = {
  position: 'fixed',
  bottom: 0,
  left: 0,
  right: 0,
  background: '#060D18',
  borderTop: '1px solid #1E293B',
  display: 'flex',
  zIndex: 100,
  paddingBottom: 'env(safe-area-inset-bottom, 0)',
}

const tabBtn = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 3,
  padding: '10px 4px 8px',
  background: 'transparent',
  border: 'none',
  color: '#6B7280',
  cursor: 'pointer',
  transition: 'color 0.15s',
  minHeight: 56,
}

const tabBtnActive = {
  color: '#F59E0B',
}

const signOutBtn = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 2,
  background: 'transparent',
  border: 'none',
  color: '#6B7280',
  cursor: 'pointer',
  padding: '4px 8px',
  fontFamily: 'inherit',
}

const backBtn = {
  background: 'none',
  border: 'none',
  color: '#F59E0B',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
  padding: '0 0 8px 0',
  fontFamily: 'inherit',
}

const errorBanner = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  background: '#7F1D1D33',
  border: '1px solid #EF444466',
  borderRadius: 8,
  padding: '10px 14px',
  color: '#FCA5A5',
  fontSize: 13,
  marginBottom: 16,
}
