import { NextResponse } from "next/server";
import { buildLocalCoachingPlan, getWorkoutSummary, groupWorkoutsByExercise } from "@/lib/progression";
import { buildLocalPremiumAnalysis, isPremiumProfile, normalizePremiumAnalysis } from "@/lib/insights";

function extractJson(text) {
  if (!text) return null;
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;

  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}

function normalizePlan(plan, fallback) {
  return {
    score: Number(plan?.score) || fallback.score,
    headline: plan?.headline || fallback.headline,
    focus: plan?.focus || fallback.focus,
    nextWorkout: Array.isArray(plan?.nextWorkout) && plan.nextWorkout.length ? plan.nextWorkout.slice(0, 4) : fallback.nextWorkout,
    improvements: Array.isArray(plan?.improvements) && plan.improvements.length ? plan.improvements.slice(0, 5) : fallback.improvements,
    recovery: plan?.recovery || fallback.recovery,
    premiumAdvice: Array.isArray(plan?.premiumAdvice) ? plan.premiumAdvice.slice(0, 4) : [],
    weakPoints: Array.isArray(plan?.weakPoints) ? plan.weakPoints.slice(0, 4) : [],
    weeklyUpgradePath: Array.isArray(plan?.weeklyUpgradePath) ? plan.weeklyUpgradePath.slice(0, 5) : [],
  };
}

export async function POST(req) {
  try {
    const { workouts = [], profile = {}, mode = "basic" } = await req.json();
    const fallback = buildLocalCoachingPlan(workouts, profile);
    const premiumRequested = mode === "premium";
    const isPremium = isPremiumProfile(profile);
    const summary = getWorkoutSummary(workouts);
    const premiumFallback = buildLocalPremiumAnalysis(workouts, profile, summary);

    if (premiumRequested && !isPremium) {
      return NextResponse.json({ gated: true, source: "paywall" }, { status: 402 });
    }

    if (!workouts.length) {
      return premiumRequested
        ? NextResponse.json({ premiumAnalysis: premiumFallback, source: "local" })
        : NextResponse.json({ plan: fallback, source: "local" });
    }

    if (!process.env.GEMINI_API_KEY) {
      return premiumRequested
        ? NextResponse.json({ premiumAnalysis: premiumFallback, source: "local" })
        : NextResponse.json({ plan: fallback, source: "local" });
    }

    const exerciseGroups = Object.entries(groupWorkoutsByExercise(workouts)).map(([exercise, sets]) => ({
      exercise,
      sets: sets.slice(0, 8).map((set) => ({
        reps: Number(set.reps || 0),
        weight: Number(set.weight || 0),
        date: set.created_at,
      })),
    }));

    const basicPrompt = `You are a practical strength and hypertrophy coach inside a gamified workout tracker.
Return only valid JSON matching this shape:
{
  "score": number from 1-100,
  "headline": "one concise next-session headline",
  "focus": "one sentence explaining the main training priority",
  "nextWorkout": [{"exercise":"name","prescription":"sets/reps/load target","reason":"why"}],
  "improvements": ["3-5 short actionable cues"],
  "recovery": "one recovery recommendation"
}
Use conservative progression. Do not suggest unsafe max attempts. Prefer the user's logged exercises when possible.

Profile: ${JSON.stringify({ goal: profile.goal, age: profile.age, weight: profile.weight })}
Summary: ${JSON.stringify(summary)}
Recent training by exercise: ${JSON.stringify(exerciseGroups)}`;

    const premiumPrompt = `You are Gemini powering the premium AI analysis tier in AI Fitness.
Return only valid JSON matching this shape:
{
  "summary": "a materially personalized 2-3 sentence analysis using the user's recent exercise names, volume, goal, and fatigue signals",
  "priorities": ["3-4 specific coaching priorities with concrete next actions"],
  "risks": ["2-3 likely plateau, recovery, form, or programming risks inferred from the logs"],
  "nextCheckIn": "one precise thing to compare after the next workout"
}
Be specific and useful. Use conservative progression. Do not provide medical advice or unsafe max-attempt instructions.

Profile: ${JSON.stringify({ goal: profile.goal, age: profile.age, weight: profile.weight, tier: profile.tier })}
Summary: ${JSON.stringify(summary)}
Recent training by exercise: ${JSON.stringify(exerciseGroups)}`;

    const model = process.env.GEMINI_MODEL || "gemini-1.5-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: premiumRequested ? premiumPrompt : basicPrompt }] }],
        generationConfig: {
          temperature: 0.35,
          responseMimeType: "application/json",
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("GOOGLE_API_ERROR:", JSON.stringify(data));
      return premiumRequested
        ? NextResponse.json({ premiumAnalysis: premiumFallback, source: "local", warning: data.error?.message || "AI provider unavailable" })
        : NextResponse.json({ plan: fallback, source: "local", warning: data.error?.message || "AI provider unavailable" });
    }

    const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    const parsed = extractJson(aiText);

    if (premiumRequested) {
      const premiumAnalysis = normalizePremiumAnalysis(parsed, premiumFallback);
      return NextResponse.json({ premiumAnalysis, source: "ai", provider: "Gemini", model, premium: true });
    }

    const plan = normalizePlan(parsed, fallback);

    return NextResponse.json({ plan, source: "ai", provider: "Gemini", model, premium: false });
  } catch (error) {
    console.error("INSIGHTS_API_ERROR:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
