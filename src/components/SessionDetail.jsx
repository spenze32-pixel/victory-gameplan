// Victory GamePlan V2 — SessionDetail component
import {
  calculateSessionAverage,
  calculateHighGame,
  calculateLowGame,
  getMostCommonMiss,
  getMostCommonSpareIssue,
  getMostUsedBall,
  generateSessionInsight,
  generateNextPracticeFocus,
} from '../utils/performanceInsights';

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  } catch { return dateStr; }
};

const conditionColor = (c) => {
  if (c === 'Fresh') return '#10B981';
  if (c === 'Transition') return '#F59E0B';
  if (c === 'Burn') return '#EF4444';
  return '#6B7280';
};

const scoreColor = (score) => {
  if (score >= 250) return '#F59E0B';
  if (score >= 200) return '#10B981';
  if (score >= 170) return '#60A5FA';
  return '#F9FAFB';
};

export default function SessionDetail({ session, onEdit, onBack }) {
  if (!session) return null;

  const avg = calculateSessionAverage(session);
  const high = calculateHighGame(session);
  const low = calculateLowGame(session);
  const miss = getMostCommonMiss(session);
  const spare = getMostCommonSpareIssue(session);
  const ball = getMostUsedBall(session);
  const insights = generateSessionInsight(session);
  const focuses = generateNextPracticeFocus(session);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Back button */}
      <button onClick={onBack} style={backBtn}>
        ← Back
      </button>

      {/* Session Header */}
      <div style={headerCard}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#F9FAFB' }}>
              {session.bowlingCenter || 'Unnamed Center'}
            </div>
            <div style={{ fontSize: 14, color: '#9CA3AF', marginTop: 4 }}>
              {formatDate(session.date)}
              {session.startTime ? ` at ${session.startTime}` : ''}
            </div>
            {(session.city || session.state) && (
              <div style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>
                📍 {[session.city, session.state].filter(Boolean).join(', ')}
              </div>
            )}
          </div>
          <button onClick={onEdit} style={editBtn}>✏️ Edit Session</button>
        </div>

        {/* Meta badges */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
          {session.sessionType && <MetaBadge label={session.sessionType} />}
          {session.lanePair && <MetaBadge label={`Lanes ${session.lanePair}`} icon="🎳" />}
          {session.laneCondition && (
            <MetaBadge label={session.laneCondition} color={conditionColor(session.laneCondition)} />
          )}
          {session.oilPattern && (
            <MetaBadge label={`${session.oilPattern}${session.patternLength ? ` · ${session.patternLength}` : ''}`} icon="💧" />
          )}
        </div>
      </div>

      {/* Score Summary */}
      <div style={scoreGrid}>
        <ScoreStat label="Average" value={avg || '—'} accent="#F59E0B" large />
        <ScoreStat label="High Game" value={high || '—'} accent={high ? scoreColor(high) : undefined} large />
        <ScoreStat label="Low Game" value={low || '—'} />
        <ScoreStat label="Total Games" value={session.games?.length || 0} />
        {miss && <ScoreStat label="Main Miss" value={miss} small />}
        {spare && spare !== 'None' && <ScoreStat label="Spare Issue" value={spare} small />}
        {ball && <ScoreStat label="Primary Ball" value={ball} small />}
      </div>

      {/* Game Breakdown */}
      <section>
        <h3 style={sectionTitle}>Game Breakdown</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {session.games?.map((game, idx) => (
            <div key={game.id || idx} style={gameCard}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Game {game.gameNumber || idx + 1}
                </div>
                <div style={{ fontSize: 28, fontWeight: 900, color: scoreColor(Number(game.score)) }}>
                  {game.score ?? '—'}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10 }}>
                {game.ballUsed && <GameField label="Ball" value={game.ballUsed} />}
                {game.startingBoard && <GameField label="Starting Board" value={game.startingBoard} />}
                {game.targetBoard && <GameField label="Target Board" value={game.targetBoard} />}
                {game.breakpoint && <GameField label="Breakpoint" value={game.breakpoint} />}
                {game.missTendency && <GameField label="Miss" value={game.missTendency} color="#F59E0B" />}
                {game.spareIssues && game.spareIssues !== 'None' && (
                  <GameField label="Spare Issue" value={game.spareIssues} color="#EF4444" />
                )}
              </div>

              {game.notes && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #1E293B', fontSize: 13, color: '#9CA3AF', lineHeight: 1.6, fontStyle: 'italic' }}>
                  "{game.notes}"
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Overall Notes */}
      {session.overallNotes && (
        <section style={sectionCard}>
          <h3 style={{ ...sectionTitle, marginBottom: 10 }}>Session Notes</h3>
          <p style={{ fontSize: 14, color: '#D1D5DB', lineHeight: 1.7, margin: 0 }}>
            {session.overallNotes}
          </p>
        </section>
      )}

      {/* Coaching Review */}
      {insights?.length > 0 && (
        <section style={{ ...sectionCard, borderColor: '#F59E0B33' }}>
          <h3 style={{ ...sectionTitle, color: '#F59E0B', marginBottom: 14 }}>
            🏅 Performance Review
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {insights.map((insight, i) => (
              <div key={i} style={insightRow}>
                <div style={{ color: '#F59E0B', fontSize: 16, flexShrink: 0 }}>›</div>
                <div style={{ fontSize: 14, color: '#D1D5DB', lineHeight: 1.65 }}>{insight}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Next Practice Focus */}
      {focuses?.length > 0 && (
        <section style={{ ...sectionCard, borderColor: '#10B98133' }}>
          <h3 style={{ ...sectionTitle, color: '#10B981', marginBottom: 14 }}>
            🎯 Next Practice Focus
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {focuses.map((focus, i) => (
              <div key={i} style={insightRow}>
                <div style={{ color: '#10B981', fontSize: 16, flexShrink: 0, fontWeight: 700 }}>{i + 1}.</div>
                <div style={{ fontSize: 14, color: '#D1D5DB', lineHeight: 1.65 }}>{focus}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Footer meta */}
      <div style={{ fontSize: 11, color: '#374151', textAlign: 'right', paddingBottom: 8 }}>
        Saved {new Date(session.createdAt).toLocaleString()}
        {session.updatedAt && session.updatedAt !== session.createdAt
          ? ` · Edited ${new Date(session.updatedAt).toLocaleString()}`
          : ''}
      </div>

    </div>
  );
}

function MetaBadge({ label, icon, color }) {
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      fontSize: 12,
      fontWeight: 600,
      color: color || '#9CA3AF',
      border: `1px solid ${color ? color + '44' : '#374151'}`,
      borderRadius: 20,
      padding: '4px 12px',
      background: color ? color + '11' : 'transparent',
    }}>
      {icon && <span>{icon}</span>}
      {label}
    </span>
  );
}

function ScoreStat({ label, value, accent, large, small }) {
  return (
    <div style={{
      background: '#111827',
      border: '1px solid #1E293B',
      borderRadius: 10,
      padding: '14px 12px',
    }}>
      <div style={{ fontSize: 11, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{label}</div>
      <div style={{
        fontSize: large ? 28 : small ? 13 : 20,
        fontWeight: 800,
        color: accent || '#F9FAFB',
        lineHeight: 1.1,
      }}>{value}</div>
    </div>
  );
}

function GameField({ label, value, color }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 13, color: color || '#D1D5DB', fontWeight: 600 }}>{value}</div>
    </div>
  );
}

// Styles
const headerCard = {
  background: '#111827',
  border: '1px solid #1E293B',
  borderRadius: 14,
  padding: '20px 18px',
};

const scoreGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
  gap: 10,
};

const gameCard = {
  background: '#111827',
  border: '1px solid #1E293B',
  borderRadius: 12,
  padding: '16px',
};

const sectionCard = {
  background: '#111827',
  border: '1px solid #1E293B',
  borderRadius: 12,
  padding: '18px 16px',
};

const sectionTitle = {
  fontSize: 13,
  fontWeight: 700,
  color: '#F9FAFB',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  margin: '0 0 12px 0',
};

const insightRow = {
  display: 'flex',
  gap: 10,
  alignItems: 'flex-start',
  paddingBottom: 12,
  borderBottom: '1px solid #1E293B',
};

const backBtn = {
  background: 'transparent',
  border: 'none',
  color: '#9CA3AF',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
  padding: '4px 0',
  textAlign: 'left',
  width: 'fit-content',
};

const editBtn = {
  background: 'transparent',
  border: '1px solid #374151',
  borderRadius: 8,
  color: '#F59E0B',
  padding: '8px 16px',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
};
