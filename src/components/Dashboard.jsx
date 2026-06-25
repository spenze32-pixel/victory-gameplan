// Victory GamePlan V2 — Dashboard component
import { useMemo } from 'react';
import StatCard from './StatCard';
import EmptyState from './EmptyState';
import {
  calculateSessionAverage,
  calculateHighGame,
  calculateLowGame,
  getMostCommonMiss,
  calculateDashboardStats,
  calculateRecentTrend,
  generateDashboardInsight,
} from '../utils/performanceInsights';

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

export default function Dashboard({ sessions, onNavigate }) {
  const stats = useMemo(() => calculateDashboardStats(sessions), [sessions]);
  const trend = useMemo(() => calculateRecentTrend(sessions), [sessions]);
  const insight = useMemo(() => generateDashboardInsight(sessions), [sessions]);
  const recentSessions = sessions.slice(0, 3);

  if (!sessions.length) {
    return (
      <EmptyState
        icon="🎳"
        title="Welcome to Victory GamePlan"
        message="No sessions logged yet. Add your first bowling session to start building your Victory GamePlan."
        action={{ label: '+ Add Your First Session', onClick: () => onNavigate('add-session') }}
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

      {/* KPI Grid */}
      <section>
        <h2 style={sectionTitle}>Performance Overview</h2>
        <div style={kpiGrid}>
          <StatCard label="Total Sessions" value={stats.totalSessions} icon="📅" />
          <StatCard label="Total Games" value={stats.totalGames} icon="🎳" />
          <StatCard label="Overall Average" value={stats.overallAverage || '—'} accent="#F59E0B" icon="📊" />
          <StatCard label="Best Game" value={stats.bestGame || '—'} accent="#10B981" icon="🏆" />
          <StatCard label="Most Recent Avg" value={stats.mostRecentAverage || '—'} icon="⚡" />
          <StatCard
            label="Home Center"
            value={stats.mostCommonCenter || '—'}
            sub="Most frequent location"
            icon="📍"
          />
        </div>
      </section>

      {/* Trend + Insight Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Trend Card */}
        <div style={infoCard}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
            📈 Recent Trend
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: trend.color, marginBottom: 4 }}>
            {trend.label}
          </div>
          <div style={{ fontSize: 12, color: '#6B7280' }}>
            {trend.trend === 'insufficient'
              ? 'Log at least 4 sessions to unlock trend data'
              : 'Based on last 3 vs. previous 3 sessions'}
          </div>
        </div>

        {/* Coach Insight */}
        <div style={{ ...infoCard, borderColor: '#F59E0B33' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#F59E0B', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
            🏅 Coach Insight
          </div>
          <div style={{ fontSize: 13, color: '#D1D5DB', lineHeight: 1.6 }}>
            {insight}
          </div>
        </div>
      </div>

      {/* Recent Sessions */}
      <section>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h2 style={{ ...sectionTitle, margin: 0 }}>Recent Sessions</h2>
          <button onClick={() => onNavigate('history')} style={linkBtn}>
            View All →
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {recentSessions.map(session => {
            const avg = calculateSessionAverage(session);
            const high = calculateHighGame(session);
            const miss = getMostCommonMiss(session);
            return (
              <div key={session.id} style={sessionCard}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 16, color: '#F9FAFB' }}>
                      {session.bowlingCenter || 'Unnamed Center'}
                    </div>
                    <div style={{ fontSize: 13, color: '#9CA3AF', marginTop: 2 }}>
                      {formatDate(session.date)}
                      {session.city ? ` · ${session.city}${session.state ? `, ${session.state}` : ''}` : ''}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <span style={badge}>{session.sessionType || 'Session'}</span>
                    {session.laneCondition && (
                      <span style={{ ...badge, color: conditionColor(session.laneCondition), borderColor: conditionColor(session.laneCondition) + '44' }}>
                        {session.laneCondition}
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 20, marginTop: 12, flexWrap: 'wrap' }}>
                  <Stat label="Avg" value={avg || '—'} accent="#F59E0B" />
                  <Stat label="High" value={high || '—'} />
                  <Stat label="Games" value={session.games?.length || 0} />
                  {miss && <Stat label="Main Miss" value={miss} small />}
                </div>

                <button
                  onClick={() => onNavigate('session-detail', session)}
                  style={viewBtn}
                >
                  View Details
                </button>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value, accent, small }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      <div style={{ fontSize: small ? 13 : 18, fontWeight: 700, color: accent || '#F9FAFB', marginTop: 2 }}>{value}</div>
    </div>
  );
}

// Styles
const sectionTitle = {
  fontSize: 16,
  fontWeight: 700,
  color: '#F9FAFB',
  margin: '0 0 12px 0',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
};

const kpiGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
  gap: 12,
};

const infoCard = {
  background: '#111827',
  border: '1px solid #1E293B',
  borderRadius: 12,
  padding: '18px 16px',
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

const viewBtn = {
  marginTop: 14,
  background: 'transparent',
  border: '1px solid #374151',
  borderRadius: 8,
  color: '#F59E0B',
  padding: '8px 18px',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  width: '100%',
};

const linkBtn = {
  background: 'transparent',
  border: 'none',
  color: '#F59E0B',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  padding: 0,
};
