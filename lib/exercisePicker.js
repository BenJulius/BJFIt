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

export function sanitizeExerciseNameList(names = []) {
  const seen = new Set();
  const clean = [];
  names.forEach((name) => {
    const normalized = normalizeExerciseName(name);
    const key = getExerciseKey(normalized);
    if (!key || seen.has(key)) return;
    seen.add(key);
    clean.push(normalized);
  });
  return clean;
}

export function toggleFavoriteExercise(favorites = [], exerciseName = "") {
  const normalized = normalizeExerciseName(exerciseName);
  const key = getExerciseKey(normalized);
  if (!key) return sanitizeExerciseNameList(favorites);

  const list = sanitizeExerciseNameList(favorites);
  const existingIndex = list.findIndex((name) => getExerciseKey(name) === key);
  if (existingIndex >= 0) {
    return list.filter((_, index) => index !== existingIndex);
  }
  return [normalized, ...list];
}

export function buildRecentExercises(workouts = [], limit = 6) {
  const recent = [];
  const seen = new Set();

  workouts.forEach((workout) => {
    const normalized = normalizeExerciseName(workout?.exercise);
    const key = getExerciseKey(normalized);
    if (!key || seen.has(key)) return;
    seen.add(key);
    recent.push(normalized);
  });

  return recent.slice(0, limit);
}

export function rankExerciseOptions(options = [], favorites = [], recent = []) {
  const favoriteKeys = new Set(sanitizeExerciseNameList(favorites).map((name) => getExerciseKey(name)));
  const recentOrder = sanitizeExerciseNameList(recent).reduce((map, name, index) => {
    map.set(getExerciseKey(name), index);
    return map;
  }, new Map());

  return [...options].sort((a, b) => {
    const aKey = getExerciseKey(a?.name);
    const bKey = getExerciseKey(b?.name);
    const aFavorite = favoriteKeys.has(aKey) ? 1 : 0;
    const bFavorite = favoriteKeys.has(bKey) ? 1 : 0;
    if (aFavorite !== bFavorite) return bFavorite - aFavorite;

    const aRecentIndex = recentOrder.has(aKey) ? recentOrder.get(aKey) : Number.POSITIVE_INFINITY;
    const bRecentIndex = recentOrder.has(bKey) ? recentOrder.get(bKey) : Number.POSITIVE_INFINITY;
    if (aRecentIndex !== bRecentIndex) return aRecentIndex - bRecentIndex;

    return String(a?.name || "").localeCompare(String(b?.name || ""));
  });
}
