// Victory GamePlan V2 — SessionHistory component
import { useState, useMemo } from 'react';
import EmptyState from './EmptyState';
import { calculateSessionAverage, calculateHighGame, calculateLowGame, getMostCommonMiss } from '../utils/performanceInsights';

const SESSION_TYPES = ['All', 'Practice', 'League', 'Tournament', 'Open Bowling', 'Lesson / Coaching', 'Other'];
const LANE_CONDITIONS = ['All', 'Fresh', 'Transition', 'Burn', 'Unknown'];

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch { return dateStr; }
};

const conditionColor = (c) => {
  if (c === 'Fresh') return '#10B981';
  if (c === 'Transition') return '#F59E0B';
  if (c === 'Burn') return '#EF4444';
  return '#6B7280';
};

export default function SessionHistory({ sessions, onView, onEdit, onDelete, onNavigate }) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [condFilter, setCondFilter] = useState('All');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const filtered = useMemo(() => {
    return sessions.filter(s => {
      const matchSearch = !search ||
        (s.bowlingCenter || '').toLowerCase().includes(search.toLowerCase()) ||
        (s.city || '').toLowerCase().includes(search.toLowerCase());
      const matchType = typeFilter === 'All' || s.sessionType === typeFilter;
      const matchCond = condFilter === 'All' || s.laneCondition === condFilter;
      return matchSearch && matchType && matchCond;
    });
  }, [sessions, search, typeFilter, condFilter]);

  const handleDelete = (id) => {
    setDeleteConfirm(id);
  };

  const confirmDelete = () => {
    if (deleteConfirm) {
      onDelete(deleteConfirm);
      setDeleteConfirm(null);
    }
  };

  if (!sessions.length) {
    return (
      <EmptyState
        icon="📋"
        title="No Session History Yet"
        message="Once you save a session, it will appear here."
        action={{ label: '+ Add Your First Session', onClick: () => onNavigate('add-session') }}
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Filters */}
      <div style={filterBar}>
        <input
          type="search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by bowling center or city…"
          style={{ ...filterInput, flex: '1 1 200px' }}
        />
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={{ ...filterInput, flex: '0 0 auto' }}>
          {SESSION_TYPES.map(t => <option key={t} value={t}>{t === 'All' ? 'All Types' : t}</option>)}
        </select>
        <select value={condFilter} onChange={e => setCondFilter(e.target.value)} style={{ ...filterInput, flex: '0 0 auto' }}>
          {LANE_CONDITIONS.map(c => <option key={c} value={c}>{c === 'All' ? 'All Conditions' : c}</option>)}
        </select>
      </div>

      {/* Result count */}
      <div style={{ fontSize: 13, color: '#6B7280' }}>
        {filtered.length} session{filtered.length !== 1 ? 's' : ''} found
        {filtered.length !== sessions.length ? ` (filtered from ${sessions.length})` : ''}
      </div>

      {/* Session Cards */}
      {!filtered.length ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#9CA3AF' }}>
          No sessions match your filters.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {filtered.map(session => {
            const avg = calculateSessionAverage(session);
            const high = calculateHighGame(session);
            const low = calculateLowGame(session);
            const miss = getMostCommonMiss(session);
            return (
              <div key={session.id} style={sessionCard}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 17, color: '#F9FAFB' }}>
                      {session.bowlingCenter || 'Unnamed Center'}
                    </div>
                    <div style={{ fontSize: 13, color: '#9CA3AF', marginTop: 2 }}>
                      {formatDate(session.date)}
                      {session.city ? ` · ${session.city}${session.state ? `, ${session.state}` : ''}` : ''}
                      {session.lanePair ? ` · Lanes ${session.lanePair}` : ''}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {session.sessionType && <span style={badge}>{session.sessionType}</span>}
                    {session.laneCondition && (
                      <span style={{ ...badge, color: conditionColor(session.laneCondition), borderColor: conditionColor(session.laneCondition) + '44' }}>
                        {session.laneCondition}
                      </span>
                    )}
                  </div>
                </div>

                {/* Stats Row */}
                <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginTop: 12, paddingTop: 12, borderTop: '1px solid #1E293B' }}>
                  <MiniStat label="Average" value={avg || '—'} accent="#F59E0B" />
                  <MiniStat label="High" value={high || '—'} />
                  <MiniStat label="Low" value={low || '—'} />
                  <MiniStat label="Games" value={session.games?.length || 0} />
                  {miss && <MiniStat label="Main Miss" value={miss} small />}
                </div>

                {/* Notes preview */}
                {session.overallNotes && (
                  <div style={{ fontSize: 12, color: '#6B7280', marginTop: 8, fontStyle: 'italic', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    "{session.overallNotes}"
                  </div>
                )}

                {/* Buttons */}
                <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
                  <button onClick={() => onView(session)} style={btnPrimary}>View Details</button>
                  <button onClick={() => onEdit(session)} style={btnSecondary}>Edit</button>
                  <button onClick={() => handleDelete(session.id)} style={btnDanger}>Delete</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div style={modalOverlay} onClick={() => setDeleteConfirm(null)}>
          <div style={modalBox} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#F9FAFB', marginBottom: 8 }}>
              Delete Session?
            </div>
            <div style={{ fontSize: 14, color: '#9CA3AF', marginBottom: 24, lineHeight: 1.6 }}>
              Are you sure you want to delete this session? This cannot be undone.
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={confirmDelete} style={{ ...btnDanger, flex: 1, padding: '12px 0', background: '#EF4444', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 15 }}>
                Yes, Delete
              </button>
              <button onClick={() => setDeleteConfirm(null)} style={{ ...btnSecondary, flex: 1, padding: '12px 0' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MiniStat({ label, value, accent, small }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      <div style={{ fontSize: small ? 12 : 17, fontWeight: 700, color: accent || '#F9FAFB', marginTop: 2 }}>{value}</div>
    </div>
  );
}

// Styles
const filterBar = {
  display: 'flex',
  gap: 10,
  flexWrap: 'wrap',
};

const filterInput = {
  background: '#111827',
  border: '1px solid #374151',
  borderRadius: 8,
  color: '#F9FAFB',
  fontSize: 14,
  padding: '10px 12px',
  outline: 'none',
  fontFamily: 'inherit',
  minWidth: 0,
};

const sessionCard = {
  background: '#111827',
  border: '1px solid #1E293B',
  borderRadius: 12,
  padding: '16px',
};

const badge = {
  display: 'inline-block',
  fontSize: 11,
  fontWeight: 600,
  color: '#9CA3AF',
  border: '1px solid #374151',
  borderRadius: 20,
  padding: '2px 10px',
};

const btnPrimary = {
  background: '#F59E0B',
  color: '#0B1220',
  border: 'none',
  borderRadius: 8,
  padding: '8px 16px',
  fontWeight: 700,
  fontSize: 13,
  cursor: 'pointer',
};

const btnSecondary = {
  background: 'transparent',
  color: '#9CA3AF',
  border: '1px solid #374151',
  borderRadius: 8,
  padding: '8px 16px',
  fontWeight: 600,
  fontSize: 13,
  cursor: 'pointer',
};

const btnDanger = {
  background: 'transparent',
  color: '#EF4444',
  border: '1px solid #EF444444',
  borderRadius: 8,
  padding: '8px 16px',
  fontWeight: 600,
  fontSize: 13,
  cursor: 'pointer',
};

const modalOverlay = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.7)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  padding: 24,
};

const modalBox = {
  background: '#111827',
  border: '1px solid #374151',
  borderRadius: 16,
  padding: 28,
  maxWidth: 380,
  width: '100%',
  textAlign: 'center',
};
