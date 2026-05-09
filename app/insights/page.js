"use client";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import { BrainCircuit, CheckCircle2, Hourglass, Loader2, RefreshCw, Sparkles, Target, Zap } from "lucide-react";
import LevelCompanion from "@/components/LevelCompanion";
import { buildLocalCoachingPlan, getWorkoutSummary } from "@/lib/progression";

export default function Insights() {
  const [profile, setProfile] = useState(null);
  const [workouts, setWorkouts] = useState([]);
  const [plan, setPlan] = useState(null);
  const [source, setSource] = useState("local");
  const [loading, setLoading] = useState(true);
  const [coaching, setCoaching] = useState(false);
  const [error, setError] = useState("");

  const summary = useMemo(() => getWorkoutSummary(workouts), [workouts]);

  const fetchCoach = async (nextWorkouts = workouts, nextProfile = profile) => {
    setCoaching(true);
    setError("");
    try {
      const response = await fetch("/api/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workouts: nextWorkouts, profile: nextProfile }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Coach unavailable");
      setPlan(data.plan);
      setSource(data.source || "local");
    } catch (err) {
      setError(err.message);
      setPlan(buildLocalCoachingPlan(nextWorkouts, nextProfile));
      setSource("local");
    } finally {
      setCoaching(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const [profileRes, workoutsRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).single(),
        supabase.from("workouts").select("*").order("created_at", { ascending: false }).limit(40),
      ]);

      const nextProfile = profileRes.data || {};
      const nextWorkouts = workoutsRes.data || [];
      setProfile(nextProfile);
      setWorkouts(nextWorkouts);
      setPlan(buildLocalCoachingPlan(nextWorkouts, nextProfile));
      setLoading(false);
      fetchCoach(nextWorkouts, nextProfile);
    };

    load();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <Loader2 className="animate-spin text-emerald-400 w-8 h-8" />
      </div>
    );
  }

  const activePlan = plan || buildLocalCoachingPlan(workouts, profile || {});

  return (
    <div className="min-h-screen bg-slate-100 px-5 pb-32 pt-8 text-slate-950 dark:bg-slate-950 dark:text-white">
      <div className="mx-auto max-w-md space-y-5">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-cyan-500">AI Coach</p>
            <h1 className="mt-1 text-3xl font-black tracking-tight">Next Workout</h1>
          </div>
          <button
            onClick={() => fetchCoach()}
            disabled={coaching}
            className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-lg dark:bg-white dark:text-slate-950"
          >
            {coaching ? <Hourglass className="animate-pulse" size={22} /> : <RefreshCw size={22} />}
          </button>
        </header>

        <LevelCompanion totalXP={profile?.total_xp || 0} size="compact" mood="ready" characterId={profile?.avatar || "panda"} />

        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <BrainCircuit size={18} className="text-cyan-500" />
                <span className="text-xs font-black uppercase tracking-wider text-slate-500">{source === "ai" ? "AI generated" : "Local coach"}</span>
              </div>
              <h2 className="text-2xl font-black leading-tight">{activePlan.headline}</h2>
            </div>
            <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700 dark:bg-cyan-400/10 dark:text-cyan-300">
              <span className="text-2xl font-black">{activePlan.score}</span>
              <span className="text-[9px] font-black uppercase">Score</span>
            </div>
          </div>
          <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{activePlan.focus}</p>
          {error && <p className="mt-3 rounded-xl bg-amber-50 p-3 text-xs font-bold text-amber-700 dark:bg-amber-400/10 dark:text-amber-300">{error}</p>}
        </motion.section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-black">Workout Prescription</h2>
            <Target size={20} className="text-emerald-500" />
          </div>
          <div className="space-y-3">
            {activePlan.nextWorkout.map((item, index) => (
              <div key={`${item.exercise}-${index}`} className="rounded-xl bg-slate-100 p-4 dark:bg-slate-950">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="font-black">{item.exercise}</p>
                  <span className="rounded-full bg-emerald-400/15 px-2 py-1 text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-300">Step {index + 1}</span>
                </div>
                <p className="text-sm font-black text-slate-700 dark:text-slate-200">{item.prescription}</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">{item.reason}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-black">Upgrade Cues</h2>
            <Sparkles size={20} className="text-amber-400" />
          </div>
          <div className="space-y-3">
            {activePlan.improvements.map((cue) => (
              <div key={cue} className="flex gap-3 text-sm font-bold leading-5 text-slate-600 dark:text-slate-300">
                <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-500" />
                <span>{cue}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-xl bg-amber-50 p-4 text-sm font-bold leading-6 text-amber-800 dark:bg-amber-400/10 dark:text-amber-200">
            {activePlan.recovery}
          </div>
        </section>

        <section className="grid grid-cols-3 gap-3">
          {[
            ["Sets", summary.totalSets],
            ["Volume", summary.totalVolume.toLocaleString()],
            ["Moves", summary.exerciseCount],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-900">
              <p className="text-xl font-black">{value}</p>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">{label}</p>
            </div>
          ))}
        </section>

      </div>

      {coaching && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-sm rounded-3xl border border-white/10 bg-slate-900 p-5 shadow-2xl"
          >
            <div className="mb-3 flex items-center justify-center gap-2 text-amber-300">
              <Hourglass size={20} />
              <p className="text-xs font-black uppercase tracking-wider">Regenerating plan</p>
            </div>
            <LevelCompanion
              totalXP={profile?.total_xp || 0}
              size="compact"
              mood="celebrate"
              characterId={profile?.avatar || "panda"}
            />
            <motion.p
              initial={{ opacity: 0.2 }}
              animate={{ opacity: [0.2, 1, 0.2] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="mt-4 text-center text-sm font-black text-white"
            >
              Your coach is hyped and building your next attack plan.
            </motion.p>
          </motion.div>
        </div>
      )}
    </div>
  );
}
