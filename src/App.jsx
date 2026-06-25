// Victory GamePlan V2 — Main App
import { useState, useEffect, useCallback } from 'react';
import Dashboard from './components/Dashboard';
import SessionForm from './components/SessionForm';
import SessionHistory from './components/SessionHistory';
import SessionDetail from './components/SessionDetail';
import { getSessions, addSession, updateSession, deleteSession } from './utils/storage';

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'add-session', label: 'Add Session', icon: '➕' },
  { id: 'history', label: 'History', icon: '📋' },
];

export default function App() {
  const [view, setView] = useState('dashboard');
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [editingSession, setEditingSession] = useState(null);

  // Load sessions on mount
  useEffect(() => {
    setSessions(getSessions());
  }, []);

  const refresh = useCallback(() => {
    setSessions(getSessions());
  }, []);

  // Navigation
  const navigate = (viewName, session = null) => {
    setView(viewName);
    if (viewName !== 'session-detail') setSelectedSession(null);
    if (viewName !== 'edit-session') setEditingSession(null);
    if (viewName === 'session-detail' && session) setSelectedSession(session);
    if (viewName === 'edit-session' && session) setEditingSession(session);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Session actions
  const handleSave = (session) => {
    addSession(session);
    refresh();
    navigate('session-detail', session);
  };

  const handleUpdate = (session) => {
    updateSession(session.id, session);
    refresh();
    // Update selectedSession if viewing the same one
    const updated = getSessions().find(s => s.id === session.id);
    navigate('session-detail', updated || session);
  };

  const handleDelete = (sessionId) => {
    deleteSession(sessionId);
    refresh();
    if (selectedSession?.id === sessionId) navigate('history');
  };

  const handleView = (session) => navigate('session-detail', session);
  const handleEdit = (session) => navigate('edit-session', session);
  const handleEditFromDetail = () => navigate('edit-session', selectedSession);

  const isMainTab = ['dashboard', 'add-session', 'history'].includes(view);

  // Page title map
  const pageTitle = {
    dashboard: 'Dashboard',
    'add-session': 'Add Session',
    history: 'Session History',
    'session-detail': selectedSession?.bowlingCenter || 'Session Detail',
    'edit-session': 'Edit Session',
  }[view] || 'Victory GamePlan';

  return (
    <div style={appWrapper}>
      {/* Top Nav Bar */}
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
          <div style={{ fontSize: 13, color: '#6B7280', fontWeight: 600, display: 'none' }} className="desktop-subtitle">
            Victory Bowling Services
          </div>
        </div>
      </header>

      {/* Page Body */}
      <main style={mainContent}>
        <div style={contentInner}>

          {/* Page header (non-tab views) */}
          {!isMainTab && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#F9FAFB' }}>{pageTitle}</div>
            </div>
          )}

          {/* Tab-style header for main views */}
          {isMainTab && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#F9FAFB', marginBottom: 4 }}>{pageTitle}</div>
              {view === 'dashboard' && (
                <div style={{ fontSize: 13, color: '#6B7280' }}>
                  Your bowling performance at a glance
                </div>
              )}
              {view === 'add-session' && (
                <div style={{ fontSize: 13, color: '#6B7280' }}>
                  Log a new bowling session
                </div>
              )}
              {view === 'history' && (
                <div style={{ fontSize: 13, color: '#6B7280' }}>
                  All your logged sessions
                </div>
              )}
            </div>
          )}

          {/* Views */}
          {view === 'dashboard' && (
            <Dashboard sessions={sessions} onNavigate={navigate} />
          )}

          {view === 'add-session' && (
            <SessionForm
              onSave={handleSave}
              onCancel={() => navigate('dashboard')}
            />
          )}

          {view === 'history' && (
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
            />
          )}

        </div>
      </main>

      {/* Bottom Tab Nav (mobile-first) */}
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
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const appWrapper = {
  minHeight: '100vh',
  background: '#0B1220',
  color: '#F9FAFB',
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  display: 'flex',
  flexDirection: 'column',
};

const header = {
  background: '#060D18',
  borderBottom: '1px solid #1E293B',
  position: 'sticky',
  top: 0,
  zIndex: 100,
};

const headerInner = {
  maxWidth: 1200,
  margin: '0 auto',
  padding: '12px 16px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const mainContent = {
  flex: 1,
  paddingBottom: 90, // clear bottom nav
};

const contentInner = {
  maxWidth: 1200,
  margin: '0 auto',
  padding: '24px 16px',
};

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
};

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
};

const tabBtnActive = {
  color: '#F59E0B',
};
