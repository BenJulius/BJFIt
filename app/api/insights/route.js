import { NextResponse } from "next/server";
import { buildLocalCoachingPlan, getWorkoutSummary, groupWorkoutsByExercise } from "@/lib/progression";

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
  };
}

export async function POST(req) {
  try {
    const { workouts = [], profile = {} } = await req.json();
    const fallback = buildLocalCoachingPlan(workouts, profile);

    if (!workouts.length) {
      return NextResponse.json({ plan: fallback, source: "local" });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ plan: fallback, source: "local" });
    }

    const summary = getWorkoutSummary(workouts);
    const exerciseGroups = Object.entries(groupWorkoutsByExercise(workouts)).map(([exercise, sets]) => ({
      exercise,
      sets: sets.slice(0, 8).map((set) => ({
        reps: Number(set.reps || 0),
        weight: Number(set.weight || 0),
        date: set.created_at,
      })),
    }));

    const prompt = `You are a practical strength and hypertrophy coach inside a gamified workout tracker.
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

    const model = process.env.GEMINI_MODEL || "gemini-1.5-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.35,
          responseMimeType: "application/json",
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("GOOGLE_API_ERROR:", JSON.stringify(data));
      return NextResponse.json({ plan: fallback, source: "local", warning: data.error?.message || "AI provider unavailable" });
    }

    const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    const parsed = extractJson(aiText);
    const plan = normalizePlan(parsed, fallback);

    return NextResponse.json({ plan, source: "ai" });
  } catch (error) {
    console.error("INSIGHTS_API_ERROR:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
