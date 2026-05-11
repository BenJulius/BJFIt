export const ONBOARDING_STEPS = [
  { id: "welcome", label: "Launch" },
  { id: "character", label: "Character" },
  { id: "goal", label: "Goal" },
  { id: "baseline", label: "Baseline" },
  { id: "handle", label: "Handle" },
  { id: "premium", label: "Premium" },
  { id: "review", label: "Review" },
];

export const GOAL_OPTIONS = [
  {
    id: "build_muscle",
    title: "Build Muscle",
    description: "Progressive overload, stronger sets, and visible physique growth.",
    signal: "Strength + volume",
  },
  {
    id: "lose_fat",
    title: "Lose Fat",
    description: "Consistent training targets with recovery-aware calorie burn.",
    signal: "Consistency + output",
  },
  {
    id: "endurance",
    title: "Build Engine",
    description: "More stamina, better work capacity, and repeatable sessions.",
    signal: "Volume + conditioning",
  },
];

export const TRAINING_STYLES = [
  { id: "focused", title: "Focused", description: "Clear next actions and steady progression." },
  { id: "balanced", title: "Balanced", description: "Strength, conditioning, and recovery in sync." },
  { id: "aggressive", title: "Aggressive", description: "Higher challenge with tighter recovery checks." },
];

export const PLAN_OPTIONS = [
  {
    id: "yearly",
    title: "Yearly Premium",
    badge: "Signup offer",
    price: "$20 first year",
    renewal: "$100/year after the first year unless canceled",
    trial: "7-day free trial before billing",
  },
  {
    id: "monthly",
    title: "Monthly Premium",
    badge: "Flexible",
    price: "$10/month",
    renewal: "$10/month after the trial unless canceled",
    trial: "7-day free trial before billing",
  },
  {
    id: "free",
    title: "Start Free",
    badge: "No card required",
    price: "$0",
    renewal: "Basic logging, quests, and character progression",
    trial: "Upgrade later from your profile",
  },
];

export function getStepProgress(step, total = ONBOARDING_STEPS.length) {
  const safeStep = Math.max(1, Math.min(Number(step) || 1, total));
  return Math.round((safeStep / total) * 100);
}

export function isPremiumPlan(planChoice) {
  return planChoice === "yearly" || planChoice === "monthly";
}

export function normalizeHandle(value = "") {
  return String(value).toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 20);
}

export function buildHandleSuggestions(rawName = "athlete", randomSuffix = 7) {
  const base = normalizeHandle(rawName).replace(/_/g, "") || "athlete";
  const first = normalizeHandle(String(rawName).split(" ")[0]).replace(/_/g, "") || "athlete";
  return Array.from(new Set([base, `${base}${randomSuffix}`, `${first}_lifts`])).slice(0, 3);
}

export function validateOnboardingStep(step, formData = {}, agreements = {}) {
  if (step === 3 && !formData.goal) return "Choose the goal you want BJ Fit to optimize around.";
  if (step === 4 && !formData.age) return "Add your age so training guidance can be calibrated.";
  if (step === 4 && !formData.weight) return "Add your current weight for more useful progress tracking.";
  if (step === 5 && (!formData.username || formData.username.length < 3)) return "Choose a handle with at least 3 characters.";
  if (step === 6 && isPremiumPlan(formData.planChoice) && !agreements.acceptTrialTerms) {
    return "Confirm the 7-day trial and renewal terms before starting premium.";
  }
  return "";
}

