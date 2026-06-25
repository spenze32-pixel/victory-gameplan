// Victory GamePlan V3 — Supabase async data layer
// Replaces storage.js. All functions are async and return the same shapes
// that V2 components expect (camelCase, games nested in sessions).
import { supabase } from '../lib/supabase'

// ─── Mapping helpers ─────────────────────────────────────────────────────────

function dbSessionToApp(row) {
  return {
    id: row.id,
    userId: row.user_id,
    date: row.date,
    startTime: row.start_time || '',
    bowlingCenter: row.bowling_center || '',
    city: row.city || '',
    state: row.state || '',
    lanePair: row.lane_pair || '',
    sessionType: row.session_type || '',
    oilPattern: row.oil_pattern || '',
    patternLength: row.pattern_length || '',
    laneCondition: row.lane_condition || '',
    overallNotes: row.overall_notes || '',
    sessionRating: row.session_rating || null,
    isSharedWithCoach: row.is_shared_with_coach || false,
    tournamentName: row.tournament_name || '',
    legacyId: row.legacy_id || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    games: (row.games || [])
      .map(dbGameToApp)
      .sort((a, b) => a.gameNumber - b.gameNumber),
  }
}

function dbGameToApp(row) {
  return {
    id: row.id,
    sessionId: row.session_id,
    userId: row.user_id,
    gameNumber: row.game_number,
    score: row.score,
    ballUsed: row.ball_name || '',   // V2 compatibility — ball_name maps to ballUsed
    ballId: row.ball_id || null,
    startingBoard: row.starting_board || '',
    targetBoard: row.target_board || '',
    breakpoint: row.breakpoint || '',
    missTendency: row.miss_tendency || '',
    spareIssues: row.spare_issues || '',
    strikeCount: row.strike_count || null,
    spareCount: row.spare_count || null,
    openFrameCount: row.open_frame_count || null,
    splitsFaced: row.splits_faced || null,
    splitsConverted: row.splits_converted || null,
    notes: row.notes || '',
    createdAt: row.created_at,
  }
}

function appSessionToDB(session, userId) {
  return {
    user_id: userId,
    date: session.date,
    start_time: session.startTime || null,
    bowling_center: session.bowlingCenter || null,
    city: session.city || null,
    state: session.state || null,
    lane_pair: session.lanePair || null,
    session_type: session.sessionType || null,
    oil_pattern: session.oilPattern || null,
    pattern_length: session.patternLength || null,
    lane_condition: session.laneCondition || null,
    overall_notes: session.overallNotes || null,
    session_rating: session.sessionRating || null,
    is_shared_with_coach: session.isSharedWithCoach || false,
    tournament_name: session.tournamentName || null,
    legacy_id: session.legacyId || null,
  }
}

function appGameToDB(game, sessionId, userId) {
  return {
    session_id: sessionId,
    user_id: userId,
    game_number: game.gameNumber,
    score: Number(game.score),
    ball_name: game.ballUsed || null,
    ball_id: game.ballId || null,
    starting_board: game.startingBoard || null,
    target_board: game.targetBoard || null,
    breakpoint: game.breakpoint || null,
    miss_tendency: game.missTendency || null,
    spare_issues: game.spareIssues || null,
    strike_count: game.strikeCount ?? null,
    spare_count: game.spareCount ?? null,
    open_frame_count: game.openFrameCount ?? null,
    splits_faced: game.splitsFaced ?? null,
    splits_converted: game.splitsConverted ?? null,
    notes: game.notes || null,
  }
}

// ─── Auth helpers ─────────────────────────────────────────────────────────────

async function getUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Not authenticated')
  return user
}

// ─── Sessions CRUD ────────────────────────────────────────────────────────────

export async function getSessions() {
  const { data, error } = await supabase
    .from('sessions')
    .select('*, games(*)')
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data || []).map(dbSessionToApp)
}

export async function getSessionById(id) {
  const { data, error } = await supabase
    .from('sessions')
    .select('*, games(*)')
    .eq('id', id)
    .single()

  if (error) throw error
  return data ? dbSessionToApp(data) : null
}

export async function addSession(session) {
  const user = await getUser()
  const sessionRow = appSessionToDB(session, user.id)

  const { data: saved, error: sessionErr } = await supabase
    .from('sessions')
    .insert(sessionRow)
    .select()
    .single()

  if (sessionErr) throw sessionErr

  if (session.games?.length) {
    const gameRows = session.games.map(g => appGameToDB(g, saved.id, user.id))
    const { error: gamesErr } = await supabase.from('games').insert(gameRows)
    if (gamesErr) throw gamesErr
  }

  return getSessionById(saved.id)
}

export async function updateSession(sessionId, session) {
  const user = await getUser()
  const sessionRow = appSessionToDB(session, user.id)

  const { error: sessionErr } = await supabase
    .from('sessions')
    .update({ ...sessionRow, updated_at: new Date().toISOString() })
    .eq('id', sessionId)

  if (sessionErr) throw sessionErr

  // Replace games: delete old, insert new
  await supabase.from('games').delete().eq('session_id', sessionId)

  if (session.games?.length) {
    const gameRows = session.games.map(g => appGameToDB(g, sessionId, user.id))
    const { error: gamesErr } = await supabase.from('games').insert(gameRows)
    if (gamesErr) throw gamesErr
  }

  return getSessionById(sessionId)
}

export async function deleteSession(sessionId) {
  const { error } = await supabase
    .from('sessions')
    .delete()
    .eq('id', sessionId)
  if (error) throw error
}

// ─── V2 → V3 Migration ───────────────────────────────────────────────────────

export const V2_STORAGE_KEY = 'victory_gameplan_sessions_v2'
export const MIGRATION_DISMISSED_KEY = 'vgp_v3_migration_dismissed'

export async function migrateV2Sessions(v2Sessions) {
  let successCount = 0
  const errors = []

  for (const session of v2Sessions) {
    try {
      // Store original V2 id in legacy_id so we can detect duplicates later
      await addSession({ ...session, legacyId: session.id })
      successCount++
    } catch (err) {
      errors.push({ session, error: err.message })
    }
  }

  return { successCount, errors }
}
