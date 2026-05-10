export function isPremiumProfile(profile = {}) {
  return String(profile?.tier || "").toLowerCase() === "premium";
}

export function buildLocalPremiumAnalysis(workouts = [], profile = {}, summary = {}) {
  const goal = String(profile?.goal || "build strength").replace("_", " ");
  const recentExercise = workouts.find((workout) => workout?.exercise)?.exercise || "your main lift";
  const volume = Number(summary?.totalVolume || 0).toLocaleString();

  return {
    summary: `Your recent training shows ${summary?.totalSets || 0} logged sets and ${volume} lbs of volume. The next useful move is to make ${recentExercise} progression more repeatable for your ${goal} goal.`,
    priorities: [
      `Anchor the next session around ${recentExercise} and repeat the same setup, tempo, and rest windows.`,
      "Add load only after you match last session's rep quality across every working set.",
      "Keep one accessory slot flexible so fatigue does not bury the main progression target.",
    ],
    risks: [
      summary?.totalSets > 18 ? "Recent set count is high, so performance may flatten without extra recovery." : "The current workload is moderate, but inconsistent logging can hide fatigue trends.",
      "Single-set jumps can look like progress while total-session output stalls.",
    ],
    nextCheckIn: "After the next workout, compare total reps at the same load before increasing weight again.",
  };
}

export function normalizePremiumAnalysis(analysis, fallback) {
  return {
    summary: typeof analysis?.summary === "string" && analysis.summary.trim() ? analysis.summary.trim() : fallback.summary,
    priorities: Array.isArray(analysis?.priorities) && analysis.priorities.length
      ? analysis.priorities.filter(Boolean).slice(0, 4)
      : fallback.priorities,
    risks: Array.isArray(analysis?.risks) && analysis.risks.length
      ? analysis.risks.filter(Boolean).slice(0, 3)
      : fallback.risks,
    nextCheckIn: typeof analysis?.nextCheckIn === "string" && analysis.nextCheckIn.trim() ? analysis.nextCheckIn.trim() : fallback.nextCheckIn,
  };
}
