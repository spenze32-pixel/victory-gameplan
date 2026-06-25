// Victory GamePlan V2 — SessionForm component (Add + Edit)
import { useState, useEffect } from 'react';
import { generateId } from '../utils/storage';

const SESSION_TYPES = ['Practice', 'League', 'Tournament', 'Open Bowling', 'Lesson / Coaching', 'Other'];
const LANE_CONDITIONS = ['Fresh', 'Transition', 'Burn', 'Unknown'];
const MISS_TENDENCIES = [
  'High / Through the Face',
  'Light / Weak Hit',
  'Right Miss',
  'Left Miss',
  'Pocket but No Carry',
  'Spare Conversion Issue',
  'Speed Control Issue',
  'Other',
];
const SPARE_ISSUES = [
  'None',
  '10 Pin',
  '7 Pin',
  'Corner Pins',
  'Multi-Pin Spares',
  'Splits',
  'Chopped Spares',
  'Missed Makeable Spares',
  'Other',
];
const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY','DC',
];

const today = () => new Date().toISOString().slice(0, 10);
const nowTime = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

const emptyGame = (num = 1) => ({
  id: generateId(),
  gameNumber: num,
  score: '',
  ballUsed: '',
  startingBoard: '',
  targetBoard: '',
  breakpoint: '',
  missTendency: '',
  spareIssues: '',
  notes: '',
});

const emptySession = () => ({
  date: today(),
  startTime: nowTime(),
  bowlingCenter: '',
  city: '',
  state: '',
  lanePair: '',
  sessionType: '',
  oilPattern: '',
  patternLength: '',
  laneCondition: '',
  overallNotes: '',
  games: [emptyGame(1)],
});

export default function SessionForm({ editSession, onSave, onCancel }) {
  const [form, setForm] = useState(editSession ? mapSessionToForm(editSession) : emptySession());
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (editSession) setForm(mapSessionToForm(editSession));
  }, [editSession]);

  function mapSessionToForm(s) {
    return {
      date: s.date || today(),
      startTime: s.startTime || nowTime(),
      bowlingCenter: s.bowlingCenter || '',
      city: s.city || '',
      state: s.state || '',
      lanePair: s.lanePair || '',
      sessionType: s.sessionType || '',
      oilPattern: s.oilPattern || '',
      patternLength: s.patternLength || '',
      laneCondition: s.laneCondition || '',
      overallNotes: s.overallNotes || '',
      games: s.games?.length ? s.games.map((g, i) => ({
        id: g.id || generateId(),
        gameNumber: i + 1,
        score: g.score ?? '',
        ballUsed: g.ballUsed || '',
        startingBoard: g.startingBoard || '',
        targetBoard: g.targetBoard || '',
        breakpoint: g.breakpoint || '',
        missTendency: g.missTendency || '',
        spareIssues: g.spareIssues || '',
        notes: g.notes || '',
      })) : [emptyGame(1)],
    };
  }

  const setField = (key, value) => {
    setForm(f => ({ ...f, [key]: value }));
    if (errors[key]) setErrors(e => ({ ...e, [key]: null }));
  };

  const setGameField = (idx, key, value) => {
    setForm(f => {
      const games = [...f.games];
      games[idx] = { ...games[idx], [key]: value };
      return { ...f, games };
    });
    if (errors[`game_${idx}_${key}`]) {
      setErrors(e => ({ ...e, [`game_${idx}_${key}`]: null }));
    }
  };

  const addGame = () => {
    setForm(f => ({
      ...f,
      games: [...f.games, emptyGame(f.games.length + 1)],
    }));
  };

  const removeGame = (idx) => {
    if (form.games.length <= 1) return;
    setForm(f => {
      const games = f.games.filter((_, i) => i !== idx).map((g, i) => ({ ...g, gameNumber: i + 1 }));
      return { ...f, games };
    });
  };

  const validate = () => {
    const errs = {};
    if (!form.date) errs.date = 'Date is required.';
    if (!form.games.length) errs.games = 'At least one game is required.';
    form.games.forEach((g, i) => {
      const score = Number(g.score);
      if (g.score === '' || g.score === null || g.score === undefined) {
        errs[`game_${i}_score`] = 'Score is required.';
      } else if (isNaN(score) || score < 0 || score > 300) {
        errs[`game_${i}_score`] = 'Score must be 0–300.';
      }
    });
    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      // scroll to first error
      const firstErrEl = document.querySelector('[data-error]');
      if (firstErrEl) firstErrEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setSaving(true);
    const now = new Date().toISOString();
    const session = {
      id: editSession?.id || generateId(),
      ...form,
      games: form.games.map(g => ({ ...g, score: Number(g.score) })),
      createdAt: editSession?.createdAt || now,
      updatedAt: now,
    };

    setTimeout(() => {
      onSave(session);
      setSaving(false);
      setSuccess(true);
      if (!editSession) {
        setForm(emptySession());
      }
    }, 150);
  };

  if (success && !editSession) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 24px' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#F9FAFB', marginBottom: 8 }}>Session Saved!</div>
        <div style={{ color: '#9CA3AF', marginBottom: 28 }}>Your bowling session has been recorded.</div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => { setSuccess(false); setForm(emptySession()); }} style={btnSecondary}>
            + Add Another Session
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Session Details */}
      <section style={sectionBox}>
        <h3 style={sectionHeader}>Session Details</h3>

        <div style={fieldGrid}>
          <Field label="Date *" error={errors.date}>
            <input
              type="date"
              value={form.date}
              onChange={e => setField('date', e.target.value)}
              style={input}
              data-error={errors.date ? true : undefined}
            />
          </Field>

          <Field label="Start Time">
            <input
              type="time"
              value={form.startTime}
              onChange={e => setField('startTime', e.target.value)}
              style={input}
            />
          </Field>
        </div>

        <Field label="Bowling Center">
          <input
            type="text"
            value={form.bowlingCenter}
            onChange={e => setField('bowlingCenter', e.target.value)}
            placeholder="e.g. Grand Sierra Resort Lanes"
            style={input}
          />
        </Field>

        <div style={fieldGrid}>
          <Field label="City">
            <input
              type="text"
              value={form.city}
              onChange={e => setField('city', e.target.value)}
              placeholder="City"
              style={input}
            />
          </Field>
          <Field label="State">
            <select value={form.state} onChange={e => setField('state', e.target.value)} style={input}>
              <option value="">— State —</option>
              {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
        </div>

        <div style={fieldGrid}>
          <Field label="Lane / Lane Pair">
            <input
              type="text"
              value={form.lanePair}
              onChange={e => setField('lanePair', e.target.value)}
              placeholder="e.g. 17-18"
              style={input}
            />
          </Field>
          <Field label="Session Type">
            <select value={form.sessionType} onChange={e => setField('sessionType', e.target.value)} style={input}>
              <option value="">— Select —</option>
              {SESSION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
        </div>

        <div style={fieldGrid}>
          <Field label="Oil Pattern">
            <input
              type="text"
              value={form.oilPattern}
              onChange={e => setField('oilPattern', e.target.value)}
              placeholder="e.g. Badger 40"
              style={input}
            />
          </Field>
          <Field label="Pattern Length">
            <input
              type="text"
              value={form.patternLength}
              onChange={e => setField('patternLength', e.target.value)}
              placeholder='e.g. 40"'
              style={input}
            />
          </Field>
        </div>

        <Field label="Lane Condition">
          <select value={form.laneCondition} onChange={e => setField('laneCondition', e.target.value)} style={input}>
            <option value="">— Select —</option>
            {LANE_CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
      </section>

      {/* Games */}
      <section>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h3 style={{ ...sectionHeader, margin: 0 }}>
            Games ({form.games.length})
          </h3>
          <button type="button" onClick={addGame} style={btnGold}>
            + Add Game
          </button>
        </div>

        {errors.games && <div style={errorText}>{errors.games}</div>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {form.games.map((game, idx) => (
            <div key={game.id} style={gameCard}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#F59E0B' }}>
                  Game {game.gameNumber}
                </div>
                {form.games.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeGame(idx)}
                    style={btnDanger}
                  >
                    Remove
                  </button>
                )}
              </div>

              <div style={fieldGrid}>
                <Field label="Score *" error={errors[`game_${idx}_score`]}>
                  <input
                    type="number"
                    min="0"
                    max="300"
                    value={game.score}
                    onChange={e => setGameField(idx, 'score', e.target.value)}
                    placeholder="0–300"
                    style={input}
                    data-error={errors[`game_${idx}_score`] ? true : undefined}
                  />
                </Field>
                <Field label="Ball Used">
                  <input
                    type="text"
                    value={game.ballUsed}
                    onChange={e => setGameField(idx, 'ballUsed', e.target.value)}
                    placeholder="e.g. Storm Phaze II"
                    style={input}
                  />
                </Field>
              </div>

              <div style={fieldGrid}>
                <Field label="Starting Board">
                  <input
                    type="text"
                    value={game.startingBoard}
                    onChange={e => setGameField(idx, 'startingBoard', e.target.value)}
                    placeholder="e.g. 25"
                    style={input}
                  />
                </Field>
                <Field label="Target Board">
                  <input
                    type="text"
                    value={game.targetBoard}
                    onChange={e => setGameField(idx, 'targetBoard', e.target.value)}
                    placeholder="e.g. 10"
                    style={input}
                  />
                </Field>
              </div>

              <Field label="Breakpoint">
                <input
                  type="text"
                  value={game.breakpoint}
                  onChange={e => setGameField(idx, 'breakpoint', e.target.value)}
                  placeholder="e.g. Board 6 at arrow 3"
                  style={input}
                />
              </Field>

              <div style={fieldGrid}>
                <Field label="Miss Tendency">
                  <select value={game.missTendency} onChange={e => setGameField(idx, 'missTendency', e.target.value)} style={input}>
                    <option value="">— Select —</option>
                    {MISS_TENDENCIES.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </Field>
                <Field label="Spare Issues">
                  <select value={game.spareIssues} onChange={e => setGameField(idx, 'spareIssues', e.target.value)} style={input}>
                    <option value="">— Select —</option>
                    {SPARE_ISSUES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </Field>
              </div>

              <Field label="Game Notes">
                <textarea
                  value={game.notes}
                  onChange={e => setGameField(idx, 'notes', e.target.value)}
                  placeholder="What happened this game? Adjustments made, observations..."
                  rows={3}
                  style={{ ...input, resize: 'vertical', minHeight: 72 }}
                />
              </Field>
            </div>
          ))}
        </div>
      </section>

      {/* Overall Notes */}
      <section style={sectionBox}>
        <h3 style={sectionHeader}>Overall Session Notes</h3>
        <Field label="Notes">
          <textarea
            value={form.overallNotes}
            onChange={e => setField('overallNotes', e.target.value)}
            placeholder="General observations, what you want to remember for next time..."
            rows={4}
            style={{ ...input, resize: 'vertical', minHeight: 100 }}
          />
        </Field>
      </section>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <button type="submit" disabled={saving} style={{ ...btnGold, flex: 1, minWidth: 140, padding: '14px 20px', fontSize: 16 }}>
          {saving ? 'Saving…' : editSession ? 'Save Changes' : 'Save Session'}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} style={{ ...btnSecondary, flex: '0 0 auto' }}>
            Cancel
          </button>
        )}
      </div>

    </form>
  );
}

function Field({ label, error, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}
      </label>
      {children}
      {error && <div style={errorText} data-error>{error}</div>}
    </div>
  );
}

// Styles
const sectionBox = {
  background: '#111827',
  border: '1px solid #1E293B',
  borderRadius: 12,
  padding: '20px 16px',
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
};

const gameCard = {
  background: '#111827',
  border: '1px solid #1E293B',
  borderRadius: 12,
  padding: '16px',
  display: 'flex',
  flexDirection: 'column',
  gap: 14,
};

const sectionHeader = {
  fontSize: 14,
  fontWeight: 700,
  color: '#F9FAFB',
  margin: '0 0 4px 0',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const fieldGrid = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 12,
};

const input = {
  background: '#0B1220',
  border: '1px solid #374151',
  borderRadius: 8,
  color: '#F9FAFB',
  fontSize: 15,
  padding: '10px 12px',
  width: '100%',
  boxSizing: 'border-box',
  outline: 'none',
  fontFamily: 'inherit',
};

const btnGold = {
  background: '#F59E0B',
  color: '#0B1220',
  border: 'none',
  borderRadius: 8,
  padding: '10px 20px',
  fontWeight: 700,
  fontSize: 14,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
};

const btnSecondary = {
  background: 'transparent',
  color: '#9CA3AF',
  border: '1px solid #374151',
  borderRadius: 8,
  padding: '10px 20px',
  fontWeight: 600,
  fontSize: 14,
  cursor: 'pointer',
};

const btnDanger = {
  background: 'transparent',
  color: '#EF4444',
  border: '1px solid #EF444444',
  borderRadius: 6,
  padding: '4px 12px',
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
};

const errorText = {
  fontSize: 12,
  color: '#EF4444',
  marginTop: 2,
};
