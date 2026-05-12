export const ONBOARDING_STEPS = [
  { id: "welcome", label: "Launch" },
  { id: "goal", label: "Goal" },
  { id: "experience", label: "Experience" },
  { id: "schedule", label: "Schedule" },
  { id: "baseline", label: "Baseline" },
  { id: "preview", label: "Plan" },
  { id: "premium", label: "Premium" },
  { id: "character", label: "Character" },
  { id: "handle", label: "Handle" },
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

export const EXPERIENCE_OPTIONS = [
  { id: "beginner", title: "Just Starting", description: "Simple progression and form-first guidance." },
  { id: "intermediate", title: "Training Casually", description: "Steady progression with volume balance." },
  { id: "advanced", title: "Consistent Lifter", description: "Higher precision on progression and recovery." },
];

export const SCHEDULE_OPTIONS = [
  { id: "2", title: "2 days / week" },
  { id: "3", title: "3 days / week" },
  { id: "4", title: "4 days / week" },
  { id: "5", title: "5+ days / week" },
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
  if (step === 2 && !formData.goal) return "Choose the goal you want BJ Fit to optimize around.";
  if (step === 3 && !formData.experienceLevel) return "Choose your current training level.";
  if (step === 4 && !formData.trainingDays) return "Select how many days you can train.";
  if (step === 5 && !formData.age) return "Add your age so training guidance can be calibrated.";
  if (step === 5 && !formData.weight) return "Add your current weight for more useful progress tracking.";
  if (step === 7 && isPremiumPlan(formData.planChoice) && !agreements.acceptTrialTerms) {
    return "Confirm the 7-day trial and renewal terms before starting premium.";
  }
  if (step === 9 && (!formData.username || formData.username.length < 3)) return "Choose a handle with at least 3 characters.";
  return "";
}
