import assert from "node:assert/strict";
import { getEliteReadiness, getTrainingDayStreak } from "../lib/eliteStatus.js";

function test(name, fn) {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    throw error;
  }
}

const now = new Date("2026-05-10T12:00:00Z");
const workouts = [
  { exercise: "Bench Press", weight: 185, reps: 5, created_at: "2026-05-10T10:00:00Z" },
  { exercise: "Back Squat", weight: 225, reps: 5, created_at: "2026-05-09T10:00:00Z" },
  { exercise: "Row", weight: 135, reps: 10, created_at: "2026-05-08T10:00:00Z" },
];

test("getTrainingDayStreak counts consecutive training days ending today", () => {
  assert.equal(getTrainingDayStreak(workouts, now), 3);
});

test("getEliteReadiness returns a bounded score and actionable next step", () => {
  const readiness = getEliteReadiness(workouts, { goal: "build_muscle" }, now);

  assert.ok(readiness.score >= 0 && readiness.score <= 100);
  assert.equal(readiness.streak, 3);
  assert.equal(readiness.todaySets, 1);
  assert.equal(readiness.uniqueMoves, 3);
  assert.match(readiness.nextAction, /11 more working sets/);
});
