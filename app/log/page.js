"use client";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Clock3, Plus, Save, Trash2 } from "lucide-react";
import { isSameDay, parseISO } from "date-fns";
import { supabase } from "@/lib/supabase";
import ExercisePicker from "@/components/ExercisePicker";
import { XP_PER_SET, XP_SESSION_BONUS, getWorkoutVolume } from "@/lib/progression";
import { awardDailyCharacterProgress } from "@/lib/characterProgress";
import { normalizeExerciseName, toggleFavoriteExercise } from "@/lib/exercisePicker";

const FAVORITES_KEY = "bj-fit-favorite-exercises-v1";

function createEmptySet() {
  return { weight: "", reps: "" };
}

function mapWorkoutsByExercise(workouts = []) {
  return workouts.reduce((groups, workout) => {
    const name = normalizeExerciseName(workout.exercise);
    if (!groups[name]) groups[name] = [];
    groups[name].push(workout);
    return groups;
  }, {});
}

export default function Log() {
  const [allWorkouts, setAllWorkouts] = useState([]);
  const [todaysWorkouts, setTodaysWorkouts] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [favoriteExercises, setFavoriteExercises] = useState([]);
  const [selectedExercise, setSelectedExercise] = useState("");
  const [sessionExercises, setSessionExercises] = useState([]);
  const [sessionStartedAt, setSessionStartedAt] = useState(Date.now());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const groupedToday = useMemo(() => mapWorkoutsByExercise(todaysWorkouts), [todaysWorkouts]);

  const sessionSetCount = sessionExercises.reduce((sum, item) => sum + item.sets.length, 0);
  const sessionVolume = sessionExercises.reduce((sum, item) => sum + item.sets.reduce((setSum, set) => {
    if (!set.weight || !set.reps) return setSum;
    return setSum + getWorkoutVolume({ weight: Number(set.weight), reps: Number(set.reps) });
  }, 0), 0);
  const elapsedMinutes = Math.max(1, Math.round((Date.now() - sessionStartedAt) / 60000));

  const loadFavorites = () => {
    if (typeof window === "undefined") return [];
    try {
      const parsed = JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const persistFavorites = (nextFavorites) => {
    if (typeof window === "undefined") return;
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(nextFavorites));
  };

  const fetchData = async () => {
    const [workoutsRes, exercisesRes] = await Promise.all([
      supabase.from("workouts").select("*").order("created_at", { ascending: false }),
      supabase.from("exercises").select("*"),
    ]);

    const workoutRows = workoutsRes.data || [];
    const todayRows = workoutRows.filter((row) => isSameDay(parseISO(row.created_at), new Date()));

    setAllWorkouts(workoutRows);
    setTodaysWorkouts(todayRows);
    setExercises(exercisesRes.data || []);
    setLoading(false);
  };

  useEffect(() => {
    setFavoriteExercises(loadFavorites());
    fetchData();
  }, []);

  const onToggleFavorite = (exerciseName) => {
    const next = toggleFavoriteExercise(favoriteExercises, exerciseName);
    setFavoriteExercises(next);
    persistFavorites(next);
  };

  const addExerciseToSession = () => {
    if (!selectedExercise) return;
    const normalized = normalizeExerciseName(selectedExercise);
    const existingIndex = sessionExercises.findIndex((item) => item.exercise === normalized);
    if (existingIndex >= 0) return;

    const recentSet = (groupedToday[normalized] || [])[0];
    setSessionExercises((current) => [
      ...current,
      {
        exercise: normalized,
        sets: [{ weight: recentSet?.weight ? String(recentSet.weight) : "", reps: recentSet?.reps ? String(recentSet.reps) : "" }],
      },
    ]);
    setSelectedExercise("");
  };

  const removeExerciseFromSession = (exerciseName) => {
    setSessionExercises((current) => current.filter((item) => item.exercise !== exerciseName));
  };

  const addSetToDraft = (exerciseName) => {
    setSessionExercises((current) => current.map((item) => {
      if (item.exercise !== exerciseName) return item;
      const previous = item.sets[item.sets.length - 1] || createEmptySet();
      return { ...item, sets: [...item.sets, { ...previous }] };
    }));
  };

  const removeSetFromDraft = (exerciseName, setIndex) => {
    setSessionExercises((current) => current.map((item) => {
      if (item.exercise !== exerciseName) return item;
      if (item.sets.length === 1) return item;
      return { ...item, sets: item.sets.filter((_, index) => index !== setIndex) };
    }));
  };

  const updateDraftSet = (exerciseName, setIndex, field, value) => {
    setSessionExercises((current) => current.map((item) => {
      if (item.exercise !== exerciseName) return item;
      return {
        ...item,
        sets: item.sets.map((set, index) => {
          if (index !== setIndex) return set;
          return { ...set, [field]: value };
        }),
      };
    }));
  };

  const queueFromToday = (exerciseName) => {
    const recentSet = (groupedToday[exerciseName] || [])[0];
    if (!recentSet) return;
    const existing = sessionExercises.find((item) => item.exercise === exerciseName);
    if (existing) {
      addSetToDraft(exerciseName);
      return;
    }

    setSessionExercises((current) => [
      ...current,
      {
        exercise: exerciseName,
        sets: [{ weight: String(recentSet.weight || ""), reps: String(recentSet.reps || "") }],
      },
    ]);
  };

  const deleteLoggedSet = async (setId) => {
    setTodaysWorkouts((current) => current.filter((workout) => workout.id !== setId));
    setAllWorkouts((current) => current.filter((workout) => workout.id !== setId));
    await supabase.from("workouts").delete().eq("id", setId);
  };

  const saveSession = async () => {
    const payload = sessionExercises.flatMap((item) => item.sets
      .filter((set) => set.weight !== "" && set.reps !== "")
      .map((set) => ({ exercise: item.exercise, reps: Number(set.reps), weight: Number(set.weight) })));

    if (!payload.length) return;
    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    const rows = payload.map((set) => ({ ...set, user_id: user.id }));

    const knownExerciseKeys = new Set(exercises.map((exercise) => normalizeExerciseName(exercise.name).toLowerCase()));
    const missingExercises = [...new Set(payload.map((set) => set.exercise))].filter((name) => !knownExerciseKeys.has(name.toLowerCase()));
    if (missingExercises.length > 0) {
      const { data: created } = await supabase.from("exercises")
        .insert(missingExercises.map((name) => ({ name })))
        .select("*");
      if (created?.length) {
        setExercises((current) => [...current, ...created]);
      }
    }

    await supabase.from("workouts").insert(rows);

    const xpAward = (rows.length * XP_PER_SET) + (todaysWorkouts.length === 0 ? XP_SESSION_BONUS : 0);
    const { data: profile } = await supabase.from("profiles").select("total_xp, avatar").eq("id", user.id).single();
    if (profile) {
      await supabase.from("profiles").update({ total_xp: (profile.total_xp || 0) + xpAward }).eq("id", user.id);
      if (todaysWorkouts.length === 0) {
        awardDailyCharacterProgress(user.id, profile.avatar || "panda");
      }
    }

    await fetchData();
    setSessionExercises([]);
    setSessionStartedAt(Date.now());
    setSaving(false);
  };

  if (loading) return null;

  return (
    <div className="min-h-screen bg-slate-50 px-4 pb-28 pt-7 text-slate-900 dark:bg-slate-950 dark:text-white">
      <div className="mx-auto max-w-md space-y-4">
        <header className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-emerald-500">Workout Logger</p>
              <h1 className="mt-1 text-2xl font-black">Session Builder</h1>
            </div>
            <div className="rounded-xl bg-slate-100 px-3 py-2 text-right dark:bg-slate-800">
              <p className="text-sm font-black">{sessionSetCount} sets</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{elapsedMinutes}m</p>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-slate-100 py-2 dark:bg-slate-800">
              <p className="text-sm font-black">{sessionExercises.length}</p>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Exercises</p>
            </div>
            <div className="rounded-xl bg-slate-100 py-2 dark:bg-slate-800">
              <p className="text-sm font-black">{sessionSetCount}</p>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Draft sets</p>
            </div>
            <div className="rounded-xl bg-slate-100 py-2 dark:bg-slate-800">
              <p className="text-sm font-black">{Math.round(sessionVolume)}</p>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Volume</p>
            </div>
          </div>
        </header>

        <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-900">
          <ExercisePicker
            exercises={exercises}
            workouts={allWorkouts}
            selectedExercise={selectedExercise}
            favoriteExercises={favoriteExercises}
            onToggleFavorite={onToggleFavorite}
            onSelect={setSelectedExercise}
            label="Search movement"
          />
          <button
            type="button"
            onClick={addExerciseToSession}
            disabled={!selectedExercise}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 font-black text-white disabled:opacity-40 dark:bg-white dark:text-slate-950"
          >
            <Plus size={18} /> Add to session
          </button>
        </section>

        <section className="space-y-3">
          {sessionExercises.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-6 text-center dark:border-slate-700 dark:bg-slate-900">
              <Clock3 className="mx-auto mb-2 text-slate-400" size={20} />
              <p className="text-sm font-bold text-slate-500">Build your session with one or more exercises, then save all sets at once.</p>
            </div>
          ) : (
            sessionExercises.map((item) => (
              <motion.div key={item.exercise} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-900">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="text-lg font-black">{item.exercise}</p>
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">{item.sets.length} set{item.sets.length === 1 ? "" : "s"}</p>
                  </div>
                  <button type="button" onClick={() => removeExerciseFromSession(item.exercise)} className="rounded-xl p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10">
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="space-y-2">
                  {item.sets.map((set, index) => (
                    <div key={`${item.exercise}-set-${index}`} className="flex items-center gap-2">
                      <span className="w-7 text-center text-xs font-black text-slate-400">{index + 1}</span>
                      <input
                        type="number"
                        inputMode="decimal"
                        value={set.weight}
                        onChange={(event) => updateDraftSet(item.exercise, index, "weight", event.target.value)}
                        placeholder="Weight"
                        className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-center font-black outline-none focus:border-emerald-400 dark:border-slate-700 dark:bg-slate-950"
                      />
                      <input
                        type="number"
                        inputMode="numeric"
                        value={set.reps}
                        onChange={(event) => updateDraftSet(item.exercise, index, "reps", event.target.value)}
                        placeholder="Reps"
                        className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-center font-black outline-none focus:border-emerald-400 dark:border-slate-700 dark:bg-slate-950"
                      />
                      <button
                        type="button"
                        onClick={() => removeSetFromDraft(item.exercise, index)}
                        disabled={item.sets.length === 1}
                        className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 disabled:opacity-30 dark:hover:bg-slate-800"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
                <button type="button" onClick={() => addSetToDraft(item.exercise)} className="mt-3 flex w-full items-center justify-center gap-1 rounded-xl border border-dashed border-slate-300 py-2 text-sm font-black text-slate-500 dark:border-slate-700">
                  <Plus size={14} /> Add set
                </button>
              </motion.div>
            ))
          )}
        </section>

        <button
          type="button"
          onClick={saveSession}
          disabled={saving || sessionSetCount === 0}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-400 to-cyan-300 py-4 font-black text-slate-950 shadow-lg shadow-emerald-400/25 disabled:opacity-50"
        >
          {saving ? "Saving session..." : <><Save size={18} /> Save workout session</>}
        </button>

        <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-900">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-500">Today</h2>
            <span className="text-xs font-black text-emerald-500">{todaysWorkouts.length} logged sets</span>
          </div>
          {Object.keys(groupedToday).length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-300 px-4 py-5 text-center text-sm font-bold text-slate-500 dark:border-slate-700">
              No sets logged yet.
            </p>
          ) : (
            <div className="space-y-3">
              {Object.entries(groupedToday).map(([exerciseName, sets]) => (
                <div key={exerciseName} className="rounded-2xl bg-slate-100 p-3 dark:bg-slate-950">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="font-black">{exerciseName}</p>
                    <button type="button" onClick={() => queueFromToday(exerciseName)} className="rounded-lg bg-white px-2 py-1 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                      Quick add
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    {sets.slice(0, 4).map((set) => (
                      <div key={set.id} className="flex items-center justify-between rounded-xl bg-white px-3 py-2 text-sm dark:bg-slate-900">
                        <span className="font-bold text-slate-600 dark:text-slate-300">{set.weight} x {set.reps}</span>
                        <button type="button" onClick={() => deleteLoggedSet(set.id)} className="text-xs font-black uppercase tracking-wider text-red-500">
                          Delete
                        </button>
                      </div>
                    ))}
                    {sets.length > 4 && <p className="text-xs font-bold text-slate-500">+{sets.length - 4} more sets</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="rounded-2xl bg-emerald-400/15 px-4 py-3 text-xs font-bold text-emerald-700 dark:text-emerald-300">
          <p className="flex items-center gap-2"><CheckCircle2 size={14} /> Session bonus applies to your first saved workout session each day.</p>
        </div>
      </div>
    </div>
  );
}

