"use client";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Plus,
  Save,
  Sparkles,
  Trash2,
  Trophy,
  X,
} from "lucide-react";
import {
  addDays,
  addMonths,
  addWeeks,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
  subWeeks,
} from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import ExercisePicker from "@/components/ExercisePicker";
import LevelCompanion from "@/components/LevelCompanion";
import { getLevelState, getWorkoutVolume } from "@/lib/progression";

const getCategoryColor = (exerciseName) => {
  const name = (exerciseName || "").toLowerCase();
  if (name.includes("bench") || name.includes("press") || name.includes("chest")) return "bg-cyan-400";
  if (name.includes("squat") || name.includes("leg") || name.includes("deadlift")) return "bg-rose-400";
  if (name.includes("row") || name.includes("pull") || name.includes("back")) return "bg-emerald-400";
  if (name.includes("curl") || name.includes("arm") || name.includes("tri")) return "bg-violet-400";
  if (name.includes("core") || name.includes("abs")) return "bg-amber-400";
  return "bg-slate-400";
};

export default function Calendar() {
  const [workouts, setWorkouts] = useState([]);
  const [exercisesList, setExercisesList] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState("month");
  const [selectedDay, setSelectedDay] = useState(new Date());
  const [isLogPopupOpen, setIsLogPopupOpen] = useState(false);
  const [editSets, setEditSets] = useState([{ reps: "", weight: "" }]);
  const [editExercise, setEditExercise] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingExercise, setEditingExercise] = useState(null);

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const [workoutsRes, exercisesRes, profileRes] = await Promise.all([
      supabase.from("workouts").select("*").order("created_at", { ascending: true }),
      supabase.from("exercises").select("*").order("name", { ascending: true }),
      user ? supabase.from("profiles").select("*").eq("id", user.id).maybeSingle() : Promise.resolve({ data: null }),
    ]);

    if (workoutsRes.data) setWorkouts(workoutsRes.data);
    if (exercisesRes.data) setExercisesList(exercisesRes.data);
    if (profileRes.data) setProfile(profileRes.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const nextTimeframe = () => setCurrentDate(view === "month" ? addMonths(currentDate, 1) : addWeeks(currentDate, 1));
  const prevTimeframe = () => setCurrentDate(view === "month" ? subMonths(currentDate, 1) : subWeeks(currentDate, 1));

  const selectedDayWorkouts = useMemo(
    () => workouts.filter((workout) => selectedDay && isSameDay(parseISO(workout.created_at), selectedDay)),
    [workouts, selectedDay]
  );

  const groupedSelectedDay = useMemo(() => selectedDayWorkouts.reduce((groups, workout) => {
    if (!groups[workout.exercise]) groups[workout.exercise] = [];
    groups[workout.exercise].push(workout);
    return groups;
  }, {}), [selectedDayWorkouts]);

  const levelState = getLevelState(profile?.total_xp || 0);
  const trainedDaysThisMonth = [...new Set(workouts
    .filter((workout) => isSameMonth(parseISO(workout.created_at), currentDate))
    .map((workout) => workout.created_at.split("T")[0]))].length;
  const selectedVolume = selectedDayWorkouts.reduce((sum, workout) => sum + getWorkoutVolume(workout), 0);

  const saveRetroactiveLog = async (event) => {
    event.preventDefault();
    if (!editExercise || !selectedDay) return;
    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    const dateObj = new Date(selectedDay);
    const now = new Date();
    dateObj.setHours(now.getHours(), now.getMinutes(), now.getSeconds());

    const insertData = editSets.filter((set) => set.reps && set.weight).map((set) => ({
      user_id: user.id,
      exercise: editExercise,
      reps: Number(set.reps),
      weight: Number(set.weight),
      created_at: dateObj.toISOString(),
    }));

    if (insertData.length > 0) {
      if (!exercisesList.some((exercise) => exercise.name.toLowerCase() === editExercise.toLowerCase())) {
        const { data: createdExercise } = await supabase.from("exercises").insert({ name: editExercise }).select().maybeSingle();
        if (createdExercise) setExercisesList((prev) => [...prev, createdExercise]);
      }
      await supabase.from("workouts").insert(insertData);
      await fetchData();
    }

    setSaving(false);
    setIsLogPopupOpen(false);
    setEditExercise("");
    setEditSets([{ reps: "", weight: "" }]);
  };

  const updateLoggedSet = async (id, field, value) => {
    if (value === "") return;
    setWorkouts((prev) => prev.map((workout) => workout.id === id ? { ...workout, [field]: Number(value) } : workout));
    await supabase.from("workouts").update({ [field]: Number(value) }).eq("id", id);
  };

  const deleteLoggedSet = async (id) => {
    setWorkouts((prev) => prev.filter((workout) => workout.id !== id));
    await supabase.from("workouts").delete().eq("id", id);
  };

  const addSetToExistingExercise = async (exerciseName) => {
    const { data: { user } } = await supabase.auth.getUser();
    const existingSets = selectedDayWorkouts.filter((workout) => workout.exercise === exerciseName);
    const lastSet = existingSets[existingSets.length - 1];
    const dateObj = new Date(selectedDay);
    const now = new Date();
    dateObj.setHours(now.getHours(), now.getMinutes(), now.getSeconds());

    const { data } = await supabase.from("workouts").insert([{
      user_id: user.id,
      exercise: exerciseName,
      reps: lastSet ? lastSet.reps : 0,
      weight: lastSet ? lastSet.weight : 0,
      created_at: dateObj.toISOString(),
    }]).select();

    if (data?.[0]) setWorkouts((prev) => [...prev, data[0]]);
  };

  const renderGrid = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = view === "month" ? startOfWeek(monthStart) : startOfWeek(currentDate);
    const endDate = view === "month" ? endOfWeek(monthEnd) : endOfWeek(currentDate);
    const rows = [];
    let days = [];
    let day = startDate;

    while (day <= endDate) {
      for (let index = 0; index < 7; index += 1) {
        const cloneDay = day;
        const dayWorkouts = workouts.filter((workout) => isSameDay(parseISO(workout.created_at), cloneDay));
        const dayCategories = [...new Set(dayWorkouts.map((workout) => getCategoryColor(workout.exercise)))];
        const dayVolume = dayWorkouts.reduce((sum, workout) => sum + getWorkoutVolume(workout), 0);

        days.push(
          <button
            type="button"
            key={cloneDay.toISOString()}
            onClick={() => setSelectedDay(cloneDay)}
            className={`flex h-20 flex-col items-center justify-start border-b border-r border-slate-100 p-2 text-left transition dark:border-slate-800/60 ${
              !isSameMonth(cloneDay, monthStart) && view === "month" ? "bg-slate-50 text-slate-300 dark:bg-slate-900/60 dark:text-slate-700" : "bg-white text-slate-700 dark:bg-slate-900 dark:text-slate-200"
            } ${isSameDay(cloneDay, new Date()) ? "bg-emerald-50 dark:bg-emerald-500/10" : ""} ${
              selectedDay && isSameDay(cloneDay, selectedDay) ? "ring-2 ring-inset ring-emerald-400" : ""
            }`}
          >
            <span className={`text-sm font-black ${isSameDay(cloneDay, new Date()) ? "flex h-7 w-7 items-center justify-center rounded-full bg-emerald-400 text-slate-950" : ""}`}>
              {format(cloneDay, "d")}
            </span>
            {dayWorkouts.length > 0 && <span className="mt-1 rounded-full bg-slate-950 px-2 py-0.5 text-[9px] font-black text-white dark:bg-white dark:text-slate-950">+{dayWorkouts.length * 8}</span>}
            <div className="mt-1 flex flex-wrap justify-center gap-1">
              {dayCategories.slice(0, 4).map((color, colorIndex) => <span key={`${color}-${colorIndex}`} className={`h-2 w-2 rounded-full ${color}`} />)}
            </div>
            {dayVolume > 0 && <span className="mt-1 h-1 w-8 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700"><span className="block h-full bg-cyan-400" style={{ width: `${Math.min(100, dayVolume / 100)}%` }} /></span>}
          </button>
        );
        day = addDays(day, 1);
      }
      rows.push(<div className="grid grid-cols-7" key={day.toISOString()}>{days}</div>);
      days = [];
    }

    return rows;
  };

  if (loading) return null;

  return (
    <div className="relative min-h-screen bg-slate-50 px-5 pb-40 pt-8 dark:bg-slate-950">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-400/15 dark:text-emerald-300">
            <CalendarIcon size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">Quest Map</h1>
            <p className="text-xs font-bold text-slate-500">Train days power up your companion.</p>
          </div>
        </div>

        <div className="flex rounded-xl bg-slate-200 p-1 dark:bg-slate-800">
          {["month", "week"].map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setView(option)}
              className={`rounded-lg px-3 py-1 text-xs font-black capitalize transition ${view === option ? "bg-white text-slate-950 shadow dark:bg-slate-950 dark:text-white" : "text-slate-500"}`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-5 grid grid-cols-[1fr_112px] gap-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-xl dark:border-white/5 dark:bg-slate-900">
          <div className="mb-3 flex items-center gap-2">
            <Trophy size={18} className="text-amber-400" />
            <p className="text-xs font-black uppercase tracking-wider text-slate-500">Month Quest</p>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">{trainedDaysThisMonth} days</p>
          <p className="mt-1 text-xs font-bold text-slate-500">Level {levelState.level} {levelState.rank}</p>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
            <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, trainedDaysThisMonth * 12)}%` }} className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400" />
          </div>
        </div>
        <LevelCompanion
          totalXP={profile?.total_xp || 0}
          size="compact"
          mood={trainedDaysThisMonth >= 8 ? "celebrate" : "ready"}
          characterId={profile?.avatar || "panda"}
        />
      </div>

      <div className="mb-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl dark:border-white/5 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <button type="button" onClick={prevTimeframe} className="rounded-full p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
            <ChevronLeft size={20} />
          </button>
          <h2 className="font-black text-slate-900 dark:text-white">{format(currentDate, "MMMM yyyy")}</h2>
          <button type="button" onClick={nextTimeframe} className="rounded-full p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
            <ChevronRight size={20} />
          </button>
        </div>
        <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-950/50">
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => <div key={day} className="py-2 text-center text-xs font-black uppercase tracking-wider text-slate-400">{day}</div>)}
        </div>
        {renderGrid()}
      </div>

      <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xl dark:border-white/5 dark:bg-slate-900">
        <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
          <div>
            <h3 className="font-black text-slate-900 dark:text-white">{format(selectedDay, "EEEE, MMMM d")}</h3>
            <p className="mt-1 text-xs font-bold text-emerald-500">{selectedDayWorkouts.length} sets - {selectedVolume.toLocaleString()} lbs moved</p>
          </div>
          <button type="button" onClick={() => setIsLogPopupOpen(true)} className="flex items-center gap-2 rounded-xl bg-emerald-400 px-4 py-3 text-sm font-black text-slate-950">
            <Plus size={16} /> Add
          </button>
        </div>

        {Object.keys(groupedSelectedDay).length === 0 ? (
          <div className="flex flex-col items-center py-8 text-center text-slate-500">
            <Sparkles className="mb-3 text-emerald-400" size={30} />
            <p className="text-sm font-bold">Rest day, recovery chapter, or a missed log.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {Object.keys(groupedSelectedDay).map((exerciseName) => {
              const sets = groupedSelectedDay[exerciseName];
              const totalReps = sets.reduce((sum, set) => sum + Number(set.reps || 0), 0);
              return (
                <button
                  type="button"
                  key={exerciseName}
                  onClick={() => setEditingExercise(exerciseName)}
                  className="flex w-full items-center justify-between rounded-2xl bg-slate-50 p-4 text-left dark:bg-slate-950"
                >
                  <div className="flex items-center gap-3">
                    <span className={`h-3 w-3 rounded-full ${getCategoryColor(exerciseName)}`} />
                    <div>
                      <p className="font-black text-slate-900 dark:text-white">{exerciseName}</p>
                      <p className="text-xs font-bold text-slate-500">{sets.length} sets - {totalReps} total reps</p>
                    </div>
                  </div>
                  <Pencil size={16} className="text-slate-400" />
                </button>
              );
            })}
          </div>
        )}
      </motion.section>

      <AnimatePresence>
        {editingExercise && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-950/70 backdrop-blur-md" onClick={() => setEditingExercise(null)} />
            <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }} className="relative z-10 max-h-[80vh] w-full max-w-sm overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-slate-900">
              <div className="mb-5 flex items-center justify-between">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">{editingExercise}</h3>
                <button type="button" onClick={() => setEditingExercise(null)} className="rounded-full bg-slate-100 p-2 text-slate-500 dark:bg-slate-800">
                  <X size={16} />
                </button>
              </div>
              <div className="space-y-3">
                {(groupedSelectedDay[editingExercise] || []).map((set, index) => (
                  <div key={set.id} className="flex items-center gap-2">
                    <span className="w-8 rounded-xl bg-slate-50 py-3 text-center text-sm font-black text-slate-400 dark:bg-slate-950">{index + 1}</span>
                    <input type="number" value={set.weight || ""} onChange={(event) => updateLoggedSet(set.id, "weight", event.target.value)} className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 p-3 text-center font-black text-slate-900 outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white" />
                    <span className="font-black text-slate-400">x</span>
                    <input type="number" value={set.reps || ""} onChange={(event) => updateLoggedSet(set.id, "reps", event.target.value)} className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 p-3 text-center font-black text-slate-900 outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white" />
                    <button type="button" onClick={() => deleteLoggedSet(set.id)} className="flex h-11 w-11 items-center justify-center rounded-xl text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10">
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
                <button type="button" onClick={() => addSetToExistingExercise(editingExercise)} className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 py-4 font-black text-slate-500 dark:border-slate-700">
                  <Plus size={18} /> Add Set
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isLogPopupOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", bounce: 0, duration: 0.35 }} className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-950">
              <div className="mb-5 flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white">Add Quest Set</h2>
                  <p className="text-sm font-bold text-emerald-500">{format(selectedDay, "EEEE, MMMM d")}</p>
                </div>
                <button type="button" onClick={() => setIsLogPopupOpen(false)} className="rounded-full bg-slate-100 p-2 text-slate-500 dark:bg-slate-800">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={saveRetroactiveLog} className="space-y-5">
                <ExercisePicker exercises={exercisesList} selectedExercise={editExercise} onSelect={setEditExercise} label="Movement" />

                <div className="space-y-3">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-500">Sets</label>
                  {editSets.map((set, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="w-7 text-center text-sm font-black text-slate-400">{index + 1}</span>
                      <input type="number" required placeholder="Lbs" value={set.weight} onChange={(event) => { const nextSets = [...editSets]; nextSets[index].weight = event.target.value; setEditSets(nextSets); }} className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 p-3 text-center font-black text-slate-900 outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white" />
                      <span className="font-black text-slate-400">x</span>
                      <input type="number" required placeholder="Reps" value={set.reps} onChange={(event) => { const nextSets = [...editSets]; nextSets[index].reps = event.target.value; setEditSets(nextSets); }} className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 p-3 text-center font-black text-slate-900 outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white" />
                      <button type="button" onClick={() => setEditSets(editSets.filter((_, setIndex) => setIndex !== index))} disabled={editSets.length === 1} className="flex h-11 w-11 items-center justify-center rounded-xl text-red-400 disabled:opacity-30">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>

                <button type="button" onClick={() => setEditSets([...editSets, { reps: "", weight: "" }])} className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 py-3 font-black text-slate-500 dark:border-slate-700">
                  <Plus size={18} /> Add Set
                </button>

                <button disabled={saving || !editExercise} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 p-4 font-black text-slate-950 shadow-lg shadow-emerald-500/20 disabled:opacity-50">
                  {saving ? "Saving..." : <><Save size={20} /> Save to {format(selectedDay, "MMM d")}</>}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
