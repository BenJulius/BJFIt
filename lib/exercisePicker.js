export function normalizeExerciseName(name = "") {
  return String(name)
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase()
    .replace(/\b[a-z]/g, (char) => char.toUpperCase());
}

export function getExerciseKey(name = "") {
  return normalizeExerciseName(name).toLowerCase();
}

export function buildExerciseOptions(exercises = [], selectedExercise = "") {
  const byName = new Map();

  exercises.forEach((exercise) => {
    const name = normalizeExerciseName(exercise?.name);
    const key = getExerciseKey(name);
    if (!key || byName.has(key)) return;
    byName.set(key, { ...exercise, name });
  });

  const selectedName = normalizeExerciseName(selectedExercise);
  const selectedKey = getExerciseKey(selectedName);
  if (selectedKey && !byName.has(selectedKey)) {
    byName.set(selectedKey, { id: `custom-${selectedKey}`, name: selectedName, custom: true });
  }

  return [...byName.values()];
}

export function filterExerciseOptions(options = [], query = "") {
  const key = getExerciseKey(query);
  if (!key) return options;
  return options.filter((exercise) => getExerciseKey(exercise?.name).includes(key));
}

export function canCreateExercise(exercises = [], query = "") {
  const name = normalizeExerciseName(query);
  const key = getExerciseKey(name);
  if (key.length < 2) return false;
  return !buildExerciseOptions(exercises).some((exercise) => getExerciseKey(exercise.name) === key);
}
