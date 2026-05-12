import assert from "node:assert/strict";
import {
  buildRecentExercises,
  buildExerciseOptions,
  canCreateExercise,
  filterExerciseOptions,
  normalizeExerciseName,
  rankExerciseOptions,
  toggleFavoriteExercise,
} from "../lib/exercisePicker.js";

function test(name, fn) {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    throw error;
  }
}

const exercises = [
  { id: 1, name: "Bench Press" },
  { id: 2, name: "bench press" },
  { id: 3, name: "Back Squat" },
];

test("normalizeExerciseName trims, collapses, and title-cases custom input", () => {
  assert.equal(normalizeExerciseName("  bulgarian   split squat "), "Bulgarian Split Squat");
});

test("buildExerciseOptions deduplicates and preserves selected custom movement", () => {
  const options = buildExerciseOptions(exercises, "sled push");

  assert.deepEqual(options.map((exercise) => exercise.name), ["Bench Press", "Back Squat", "Sled Push"]);
  assert.equal(options[2].custom, true);
});

test("filterExerciseOptions and canCreateExercise support searchable custom creation", () => {
  const options = buildExerciseOptions(exercises);

  assert.deepEqual(filterExerciseOptions(options, "squat").map((exercise) => exercise.name), ["Back Squat"]);
  assert.equal(canCreateExercise(options, "bench press"), false);
  assert.equal(canCreateExercise(options, "Romanian deadlift"), true);
});

test("buildRecentExercises and rankExerciseOptions prioritize favorites and recency", () => {
  const options = buildExerciseOptions([
    { id: 1, name: "Bench Press" },
    { id: 2, name: "Back Squat" },
    { id: 3, name: "Romanian Deadlift" },
  ]);
  const recent = buildRecentExercises([
    { exercise: "Back Squat" },
    { exercise: "Bench Press" },
    { exercise: "Back Squat" },
  ]);
  const ranked = rankExerciseOptions(options, ["Romanian Deadlift"], recent);

  assert.deepEqual(recent, ["Back Squat", "Bench Press"]);
  assert.deepEqual(ranked.map((item) => item.name), ["Romanian Deadlift", "Back Squat", "Bench Press"]);
});

test("toggleFavoriteExercise adds and removes case-insensitive favorites", () => {
  const first = toggleFavoriteExercise([], "bench press");
  assert.deepEqual(first, ["Bench Press"]);

  const second = toggleFavoriteExercise(first, "Bench Press");
  assert.deepEqual(second, []);
});
