import assert from "node:assert/strict";
import {
  buildLocalCoachingPlan,
  getLevelState,
  getWorkoutSummary,
  getWorkoutVolume,
} from "../lib/progression.js";

const workouts = [
  { exercise: "Bench Press", weight: 185, reps: 5, created_at: "2026-05-09T13:00:00Z" },
  { exercise: "Bench Press", weight: 175, reps: 8, created_at: "2026-05-09T13:05:00Z" },
  { exercise: "Row", weight: 135, reps: 10, created_at: "2026-05-08T13:00:00Z" },
];

function test(name, fn) {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    throw error;
  }
}

test("getLevelState calculates level progress", () => {
  const levelState = getLevelState(700);

  assert.equal(levelState.level, 2);
  assert.equal(levelState.currentXP, 50);
  assert.equal(levelState.nextLevelXP, 650);
  assert.equal(levelState.rank, "Rookie");
});

test("getWorkoutSummary totals sets, days, volume, and exercise count", () => {
  const summary = getWorkoutSummary(workouts);

  assert.equal(getWorkoutVolume(workouts[0]), 925);
  assert.equal(summary.totalSets, 3);
  assert.equal(summary.totalVolume, 3675);
  assert.equal(summary.activeDays, 2);
  assert.equal(summary.exerciseCount, 2);
});

test("buildLocalCoachingPlan returns a next-workout prescription", () => {
  const plan = buildLocalCoachingPlan(workouts, { goal: "build_muscle" });

  assert.match(plan.headline, /Bench Press/);
  assert.equal(plan.nextWorkout.length, 3);
  assert.ok(plan.improvements.length >= 3);
  assert.match(plan.focus, /build muscle/);
});
