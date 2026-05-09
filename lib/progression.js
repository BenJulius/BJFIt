export const XP_PER_SET = 24;
export const XP_SESSION_BONUS = 80;
export const XP_PER_LEVEL = 650;

export function getWorkoutVolume(workout) {
  return Number(workout?.weight || 0) * Number(workout?.reps || 0);
}

export function getLevelState(totalXP = 0) {
  const safeXP = Math.max(0, Number(totalXP) || 0);
  const level = Math.floor(safeXP / XP_PER_LEVEL) + 1;
  const currentXP = safeXP % XP_PER_LEVEL;
  const progressPercent = Math.round((currentXP / XP_PER_LEVEL) * 100);
  const rank =
    level >= 20 ? "Legend" :
    level >= 14 ? "Champion" :
    level >= 9 ? "Vanguard" :
    level >= 5 ? "Striver" :
    "Rookie";

  return {
    level,
    rank,
    currentXP,
    nextLevelXP: XP_PER_LEVEL,
    progressPercent,
    totalXP: safeXP,
  };
}

export function getWorkoutSummary(workouts = []) {
  const totalSets = workouts.length;
  const totalVolume = workouts.reduce((sum, workout) => sum + getWorkoutVolume(workout), 0);
  const dayKeys = [...new Set(workouts.map((workout) => String(workout.created_at || "").split("T")[0]).filter(Boolean))];
  const exerciseNames = [...new Set(workouts.map((workout) => workout.exercise).filter(Boolean))];
  const lastWorkout = workouts[0] || null;

  return {
    totalSets,
    totalVolume,
    activeDays: dayKeys.length,
    exerciseCount: exerciseNames.length,
    lastWorkout,
  };
}

export function groupWorkoutsByExercise(workouts = []) {
  return workouts.reduce((groups, workout) => {
    const name = workout.exercise || "Unknown";
    if (!groups[name]) groups[name] = [];
    groups[name].push(workout);
    return groups;
  }, {});
}

export function buildLocalCoachingPlan(workouts = [], profile = {}) {
  if (!workouts.length) {
    return {
      score: 72,
      headline: "Mission start: build your first strength baseline.",
      focus: "Pick one main lift and execute 3 clean working sets today. This gives your coach enough signal to program progression.",
      nextWorkout: [
        { exercise: "Main lift", prescription: "3 sets of 8 reps at a controlled load", reason: "Builds a stable baseline for next-session overload." },
        { exercise: "Accessory lift", prescription: "2 sets of 10 reps with strict form", reason: "Adds quality volume without wrecking recovery." },
        { exercise: "Cooldown", prescription: "5 minutes easy movement and breathing", reason: "Locks in consistency and keeps the next session smooth." },
      ],
      improvements: ["Keep 1-2 reps in reserve on every set.", "Rest 90-150 seconds before heavy sets.", "Log weight and reps after each set."],
      recovery: "Leave the gym feeling strong enough to repeat this tomorrow.",
    };
  }

  const byExercise = groupWorkoutsByExercise(workouts);
  const [topExercise, topSets] = Object.entries(byExercise)
    .sort((a, b) => b[1].reduce((sum, workout) => sum + getWorkoutVolume(workout), 0) - a[1].reduce((sum, workout) => sum + getWorkoutVolume(workout), 0))[0];
  const latestSet = topSets[0];
  const nextWeight = Math.max(0, Number(latestSet.weight || 0) + 5);
  const nextReps = Math.max(5, Number(latestSet.reps || 8));
  const summary = getWorkoutSummary(workouts);
  const goal = String(profile.goal || "build strength").replace("_", " ");

  return {
    score: Math.min(96, 68 + Math.min(18, summary.activeDays * 3) + Math.min(10, summary.exerciseCount * 2)),
    headline: `Attack plan: progress ${topExercise} next session.`,
    focus: `Use your ${goal} goal as the rule: earn your load jump with clean speed and repeatable form.`,
    nextWorkout: [
      { exercise: topExercise, prescription: `3 sets of ${nextReps} at ${nextWeight} lbs`, reason: "Direct progression from your latest strongest pattern." },
      { exercise: "Secondary movement", prescription: "3 sets of 8-10 at moderate load", reason: "Builds volume while preserving main-lift output." },
      { exercise: "Core or carry", prescription: "2 hard but clean sets", reason: "Reinforces bracing and transfer for heavy lifts." },
    ],
    improvements: [
      "Add 5 lbs only when every rep is crisp and controlled.",
      "Match or beat last session total reps before pushing bigger jumps.",
      "Protect one recovery day after high-volume lower sessions.",
    ],
    recovery: summary.totalSets > 18 ? "Volume is high. Prioritize sleep and extend your warmup before your first heavy set." : "Recovery demand looks manageable. Warm up with intent and push one key lift.",
  };
}
