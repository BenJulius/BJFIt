const DAY_MS = 24 * 60 * 60 * 1000;

function toDayKey(date) {
  if (!date) return "";
  return new Date(date).toISOString().slice(0, 10);
}

export function getTrainingDayStreak(workouts = [], now = new Date()) {
  const dayKeys = new Set(workouts.map((workout) => toDayKey(workout?.created_at)).filter(Boolean));
  if (!dayKeys.size) return 0;

  let cursor = new Date(toDayKey(now));
  let streak = 0;

  while (dayKeys.has(toDayKey(cursor))) {
    streak += 1;
    cursor = new Date(cursor.getTime() - DAY_MS);
  }

  return streak;
}

export function getEliteReadiness(workouts = [], profile = {}, now = new Date()) {
  const recentSets = workouts.slice(0, 30);
  const todayKey = toDayKey(now);
  const todaySets = workouts.filter((workout) => toDayKey(workout?.created_at) === todayKey).length;
  const streak = getTrainingDayStreak(workouts, now);
  const uniqueMoves = new Set(recentSets.map((workout) => workout?.exercise).filter(Boolean)).size;
  const recentVolume = recentSets.reduce((sum, workout) => {
    return sum + (Number(workout?.weight || 0) * Number(workout?.reps || 0));
  }, 0);

  let score = 50;
  score += Math.min(20, streak * 5);
  score += Math.min(15, uniqueMoves * 3);
  score += Math.min(15, Math.floor(recentVolume / 2500));
  if (todaySets >= 12) score += 10;
  if (profile?.goal) score += 5;
  score = Math.max(0, Math.min(100, score));

  const label = score >= 85 ? "Elite-ready" : score >= 70 ? "Primed" : score >= 55 ? "Building" : "Needs signal";
  const nextAction =
    todaySets === 0
      ? "Log one focused lift today to keep the coaching signal fresh."
      : todaySets < 12
        ? `Add ${12 - todaySets} more working sets to complete today's quest.`
        : "Bank recovery, then compare your next top set against today's output.";

  return {
    score,
    label,
    streak,
    todaySets,
    uniqueMoves,
    recentVolume,
    nextAction,
  };
}
