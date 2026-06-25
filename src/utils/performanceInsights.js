// Victory GamePlan V2 — Rule-based coaching engine

export function calculateSessionAverage(session) {
  if (!session?.games?.length) return 0;
  const total = session.games.reduce((sum, g) => sum + (Number(g.score) || 0), 0);
  return Math.round(total / session.games.length);
}

export function calculateHighGame(session) {
  if (!session?.games?.length) return 0;
  return Math.max(...session.games.map(g => Number(g.score) || 0));
}

export function calculateLowGame(session) {
  if (!session?.games?.length) return 0;
  return Math.min(...session.games.map(g => Number(g.score) || 0));
}

export function getMostCommonMiss(session) {
  if (!session?.games?.length) return null;
  const misses = session.games.map(g => g.missTendency).filter(Boolean);
  if (!misses.length) return null;
  return mode(misses);
}

export function getMostCommonSpareIssue(session) {
  if (!session?.games?.length) return null;
  const issues = session.games.map(g => g.spareIssues).filter(m => m && m !== 'None');
  if (!issues.length) return null;
  return mode(issues);
}

export function getMostUsedBall(session) {
  if (!session?.games?.length) return null;
  const balls = session.games.map(g => g.ballUsed).filter(Boolean);
  if (!balls.length) return null;
  return mode(balls);
}

function mode(arr) {
  const freq = {};
  let max = 0;
  let result = null;
  arr.forEach(item => {
    freq[item] = (freq[item] || 0) + 1;
    if (freq[item] > max) { max = freq[item]; result = item; }
  });
  return result;
}

// Count unique balls used
function uniqueBalls(session) {
  const balls = session.games.map(g => g.ballUsed).filter(Boolean);
  return [...new Set(balls)];
}

export function generateSessionInsight(session) {
  if (!session?.games?.length) return null;

  const avg = calculateSessionAverage(session);
  const high = calculateHighGame(session);
  const low = calculateLowGame(session);
  const miss = getMostCommonMiss(session);
  const spare = getMostCommonSpareIssue(session);
  const ballUsed = getMostUsedBall(session);
  const balls = uniqueBalls(session);
  const spread = high - low;

  const insights = [];

  // Average-based
  if (avg < 140) {
    insights.push('Your biggest opportunity is reducing open frames. Focus on makeable spares, simple target discipline, and keeping the ball in play.');
  } else if (avg <= 169) {
    insights.push('Your next jump will come from cleaner spare shooting and more consistent first-ball pocket control.');
  } else if (avg <= 189) {
    insights.push('You are close to strong league-level consistency. Focus on repeating shots, reading transition earlier, and converting routine spares.');
  } else if (avg <= 209) {
    insights.push('Your scores show competitive potential. The next step is improving carry, ball choice, and lane transition decisions.');
  } else if (avg <= 229) {
    insights.push('You are performing at a high level. Focus on small moves, entry angle, carry percentage, and staying ahead of transition.');
  } else {
    insights.push('Your scoring pace is elite. Focus on tournament-level details: lane pair differences, ball motion windows, speed control, and adjustment timing.');
  }

  // Miss tendency
  if (miss) {
    const missMap = {
      'High / Through the Face': 'Your notes show a tendency to miss high. Watch early hook, slower speed, closed angles, or staying too long with the same target.',
      'Light / Weak Hit': 'Your notes show light hits. Check ball speed, launch angle, ball choice, and whether you need a stronger move inside or a cleaner ball.',
      'Right Miss': 'Your notes show right misses. Review target discipline, release consistency, and whether your feet and eyes are lined up correctly.',
      'Left Miss': 'Your notes show left misses. Watch pull shots, closed shoulders, or forcing the ball through the front part of the lane.',
      'Pocket but No Carry': 'You are getting to the pocket but not carrying. Look at entry angle, ball motion, surface, and whether a ball change is needed.',
      'Spare Conversion Issue': 'Spare conversion showed up as a major issue. Your next practice should prioritize corner pins and makeable spares before strike-line work.',
      'Speed Control Issue': 'Speed control was a recurring issue. Work on consistent timing in your approach and monitor ball reaction to speed changes.',
      'Other': 'Review your session notes for specific miss patterns and bring them up with your coach.',
    };
    if (missMap[miss]) insights.push(missMap[miss]);
  }

  // Spare issue
  if (spare) {
    const spareMap = {
      '10 Pin': 'Add focused 10-pin practice. A few missed 10 pins can erase a strong scoring pace.',
      '7 Pin': 'Add focused 7-pin practice and make sure your spare system is repeatable.',
      'Corner Pins': 'Corner pins need attention. Build a simple spare routine and repeat it every session.',
      'Splits': 'Splits usually start with first-ball accuracy and entry angle. Focus on pocket control and reducing high-risk misses.',
      'Multi-Pin Spares': 'Multi-pin spare shooting needs work. Practice a consistent crosslane system.',
      'Chopped Spares': 'Chopped spares indicate ball path issues on spare shots. Check your angle and target board.',
      'Missed Makeable Spares': 'You are leaving makeable spares on the table. Prioritize routine spare conversions in your next practice session.',
      'Other': 'Review your spare notes and identify patterns to address in your next session.',
    };
    if (spareMap[spare]) insights.push(spareMap[spare]);
  }

  // Ball usage
  if (balls.length === 1 && ballUsed) {
    insights.push(`You relied mostly on the ${ballUsed}. Track whether that ball continued to read correctly as the lanes transitioned.`);
  } else if (balls.length > 1) {
    insights.push(`You used multiple balls (${balls.join(', ')}). Review which ball gave you the best score and what lane condition matched it best.`);
  }

  // Score trend within session
  if (session.games.length >= 2) {
    const firstScore = Number(session.games[0].score) || 0;
    const lastScore = Number(session.games[session.games.length - 1].score) || 0;
    if (firstScore - lastScore >= 20) {
      insights.push('Your scores dropped as the session went on. Watch for transition sooner and consider earlier target or ball changes.');
    } else if (lastScore - firstScore >= 20) {
      insights.push('You improved as the session went on. Review what adjustment helped so you can recognize it faster next time.');
    }
  }

  // Consistency
  if (spread >= 40) {
    insights.push('Your scoring range was wide. Focus on consistency, spare shooting, and making faster adjustments when ball reaction changes.');
  } else if (spread < 20 && session.games.length >= 2) {
    insights.push('Your scoring was consistent this session. Now focus on increasing strike quality and improving carry.');
  }

  return insights;
}

export function generateNextPracticeFocus(session) {
  if (!session?.games?.length) return null;

  const avg = calculateSessionAverage(session);
  const miss = getMostCommonMiss(session);
  const spare = getMostCommonSpareIssue(session);

  const focuses = [];

  // Priority 1: spare issues
  if (spare && spare !== 'None') {
    focuses.push(`Spare Practice: prioritize ${spare.toLowerCase()} conversions.`);
  }

  // Priority 2: miss tendency
  if (miss && miss !== 'Other') {
    const missShort = {
      'High / Through the Face': 'Adjust target and slow your speed to reduce high misses.',
      'Light / Weak Hit': 'Work on entry angle and ball choice for light hit correction.',
      'Right Miss': 'Focus on target discipline and alignment to reduce right misses.',
      'Left Miss': 'Work on release and shoulder alignment to stop pulling the ball left.',
      'Pocket but No Carry': 'Experiment with ball surface and entry angle to improve carry.',
      'Spare Conversion Issue': 'Dedicate 30% of practice to spare shooting before strike-line work.',
      'Speed Control Issue': 'Practice consistent approach timing and monitor speed feedback.',
    };
    if (missShort[miss]) focuses.push(missShort[miss]);
  }

  // Priority 3: scoring level
  if (avg < 140) {
    focuses.push('Fundamental target practice: pick a consistent spot and repeat 20+ shots at it.');
  } else if (avg <= 169) {
    focuses.push('Strike-line consistency: repeat the same shot shape until ball reaction is predictable.');
  } else if (avg <= 189) {
    focuses.push('Transition awareness: practice recognizing when to move earlier in your session.');
  } else if (avg <= 209) {
    focuses.push('Ball arsenal: evaluate whether your current ball covers all common lane conditions.');
  } else if (avg <= 229) {
    focuses.push('Fine-tune entry angle and identify your ideal breakpoint board for this condition.');
  } else {
    focuses.push('Study lane pair differences and build your tournament adjustment framework.');
  }

  return focuses;
}

export function calculateDashboardStats(sessions) {
  if (!sessions?.length) {
    return {
      totalSessions: 0,
      totalGames: 0,
      overallAverage: 0,
      bestGame: 0,
      mostRecentAverage: 0,
      mostCommonCenter: null,
    };
  }

  const totalGames = sessions.reduce((sum, s) => sum + (s.games?.length || 0), 0);

  const allScores = sessions.flatMap(s => s.games?.map(g => Number(g.score) || 0) || []);
  const overallAverage = allScores.length
    ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)
    : 0;
  const bestGame = allScores.length ? Math.max(...allScores) : 0;

  const mostRecentAverage = sessions[0] ? calculateSessionAverage(sessions[0]) : 0;

  // Most common bowling center
  const centerFreq = {};
  sessions.forEach(s => {
    if (s.bowlingCenter) {
      centerFreq[s.bowlingCenter] = (centerFreq[s.bowlingCenter] || 0) + 1;
    }
  });
  const mostCommonCenter = Object.keys(centerFreq).length
    ? Object.entries(centerFreq).sort((a, b) => b[1] - a[1])[0][0]
    : null;

  return { totalSessions: sessions.length, totalGames, overallAverage, bestGame, mostRecentAverage, mostCommonCenter };
}

export function calculateRecentTrend(sessions) {
  if (!sessions || sessions.length < 4) {
    return { trend: 'insufficient', label: 'Not enough data yet', color: '#9CA3AF' };
  }

  const recent3 = sessions.slice(0, 3);
  const prev3 = sessions.slice(3, 6);

  const recentAvg = avg(recent3.flatMap(s => s.games?.map(g => Number(g.score) || 0) || []));
  const prevAvg = avg(prev3.flatMap(s => s.games?.map(g => Number(g.score) || 0) || []));

  const diff = recentAvg - prevAvg;

  if (diff >= 5) return { trend: 'improving', label: `Improving (+${Math.round(diff)} pins)`, color: '#10B981', diff };
  if (diff <= -5) return { trend: 'declining', label: `Declining (${Math.round(diff)} pins)`, color: '#EF4444', diff };
  return { trend: 'stable', label: 'Stable', color: '#F59E0B', diff };
}

function avg(arr) {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

export function generateDashboardInsight(sessions) {
  const trend = calculateRecentTrend(sessions);
  if (trend.trend === 'insufficient') {
    return 'Not enough sessions yet. Log at least 4 sessions to unlock better trend feedback.';
  }
  if (trend.trend === 'improving') {
    return 'Your recent average is trending up. Keep tracking your ball choice and lane transition moves.';
  }
  if (trend.trend === 'declining') {
    return 'Your recent scores are declining. Review your miss tendency and spare conversion notes from your last few sessions.';
  }
  return 'Your average is holding steady. Focus on one specific improvement each session to break through to the next level.';
}
