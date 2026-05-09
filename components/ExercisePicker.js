"use client";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Check, Dumbbell, Plus, Search, Sparkles } from "lucide-react";
import {
  buildExerciseOptions,
  canCreateExercise,
  filterExerciseOptions,
  normalizeExerciseName,
} from "@/lib/exercisePicker";

export default function ExercisePicker({ exercises = [], selectedExercise = "", onSelect, label = "Exercise" }) {
  const [query, setQuery] = useState("");
  const options = useMemo(() => buildExerciseOptions(exercises, selectedExercise), [exercises, selectedExercise]);
  const filteredExercises = useMemo(() => filterExerciseOptions(options, query), [options, query]);
  const canCreate = canCreateExercise(options, query);

  const choose = (name) => {
    onSelect(normalizeExerciseName(name));
    setQuery("");
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <label className="text-xs font-black uppercase tracking-wider text-slate-500">{label}</label>
        {selectedExercise && <span className="text-[10px] font-black uppercase tracking-wider text-emerald-500">Ready</span>}
      </div>

      {selectedExercise && (
        <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between rounded-2xl border border-emerald-400/25 bg-emerald-400/10 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-400 text-slate-950">
              <Check size={18} />
            </div>
            <span className="font-black text-slate-900 dark:text-white">{selectedExercise}</span>
          </div>
          <button type="button" onClick={() => onSelect("")} className="text-xs font-black uppercase tracking-wider text-slate-500">
            Change
          </button>
        </motion.div>
      )}

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={selectedExercise ? "Search another movement" : "Search or create a movement"}
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 pl-11 pr-4 font-bold text-slate-900 outline-none transition focus:border-emerald-400 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
        />
      </div>

      <div className="max-h-56 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50 p-2 dark:border-slate-800 dark:bg-slate-950">
        {canCreate && (
          <button
            type="button"
            onClick={() => choose(query)}
            className="mb-2 flex w-full items-center gap-3 rounded-xl border border-dashed border-emerald-400/40 bg-emerald-400/10 px-4 py-3 text-left font-black text-emerald-600 dark:text-emerald-300"
          >
            <Plus size={18} />
            Create "{normalizeExerciseName(query)}"
          </button>
        )}

        <div className="grid grid-cols-1 gap-2">
          {filteredExercises.map((exercise) => {
            const active = selectedExercise === exercise.name;
            return (
              <button
                key={exercise.id || exercise.name}
                type="button"
                onClick={() => choose(exercise.name)}
                className={`flex items-center justify-between rounded-xl px-4 py-3 text-left transition ${
                  active
                    ? "bg-slate-950 font-black text-white dark:bg-white dark:text-slate-950"
                    : "bg-white font-bold text-slate-700 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                }`}
              >
                <span className="flex items-center gap-3">
                  <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${active ? "bg-white/15 dark:bg-slate-950/10" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"}`}>
                    {exercise.custom ? <Sparkles size={15} /> : <Dumbbell size={15} />}
                  </span>
                  <span>{exercise.name}</span>
                </span>
                {active && <span className="text-[10px] font-black uppercase tracking-wider">Active</span>}
              </button>
            );
          })}
        </div>

        {filteredExercises.length === 0 && !canCreate && (
          <p className="px-4 py-5 text-center text-sm font-bold text-slate-500">No matching movements yet.</p>
        )}
      </div>
    </div>
  );
}
