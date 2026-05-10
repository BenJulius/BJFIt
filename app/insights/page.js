"use client";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import { BrainCircuit, CheckCircle2, Crown, Hourglass, Loader2, Lock, RefreshCw, Sparkles, Target, Zap } from "lucide-react";
import LevelCompanion from "@/components/LevelCompanion";
import { buildLocalCoachingPlan, getWorkoutSummary } from "@/lib/progression";
import { buildLocalPremiumAnalysis, isPremiumProfile } from "@/lib/insights";
import { getEliteReadiness } from "@/lib/eliteStatus";

export default function Insights() {
  const [profile, setProfile] = useState(null);
  const [workouts, setWorkouts] = useState([]);
  const [plan, setPlan] = useState(null);
  const [source, setSource] = useState("local");
  const [loading, setLoading] = useState(true);
  const [coaching, setCoaching] = useState(false);
  const [error, setError] = useState("");
  const [model, setModel] = useState("");
  const [premiumAnalysis, setPremiumAnalysis] = useState(null);
  const [premiumSource, setPremiumSource] = useState("paywall");
  const [premiumLoading, setPremiumLoading] = useState(false);
  const [premiumError, setPremiumError] = useState("");

  const summary = useMemo(() => getWorkoutSummary(workouts), [workouts]);
  const readiness = useMemo(() => getEliteReadiness(workouts, profile || {}), [workouts, profile]);

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
      setModel(data.model || "");
    } catch (err) {
      setError(err.message);
      setPlan(buildLocalCoachingPlan(nextWorkouts, nextProfile));
      setSource("local");
    } finally {
      setCoaching(false);
    }
  };

  const fetchPremiumCoach = async (nextWorkouts = workouts, nextProfile = profile) => {
    if (!isPremiumProfile(nextProfile)) {
      setPremiumAnalysis(null);
      setPremiumSource("paywall");
      return;
    }

    setPremiumLoading(true);
    setPremiumError("");
    try {
      const response = await fetch("/api/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workouts: nextWorkouts, profile: nextProfile, mode: "premium" }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || data.warning || "Premium coach unavailable");
      setPremiumAnalysis(data.premiumAnalysis || buildLocalPremiumAnalysis(nextWorkouts, nextProfile, getWorkoutSummary(nextWorkouts)));
      setPremiumSource(data.source || "local");
    } catch (err) {
      setPremiumError(err.message);
      setPremiumAnalysis(buildLocalPremiumAnalysis(nextWorkouts, nextProfile, getWorkoutSummary(nextWorkouts)));
      setPremiumSource("local");
    } finally {
      setPremiumLoading(false);
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
      fetchPremiumCoach(nextWorkouts, nextProfile);
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
  const premiumLocked = !isPremiumProfile(profile);
  const activePremiumAnalysis = premiumAnalysis || buildLocalPremiumAnalysis(workouts, profile || {}, summary);

  return (
    <div className="min-h-screen bg-slate-100 px-5 pb-32 pt-8 text-slate-950 dark:bg-slate-950 dark:text-white">
      <div className="mx-auto max-w-md space-y-5">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-cyan-500">AI Coach</p>
            <h1 className="mt-1 text-3xl font-black tracking-tight">Next Workout</h1>
          </div>
          <button
            onClick={() => {
              fetchCoach();
              fetchPremiumCoach();
            }}
            disabled={coaching || premiumLoading}
            className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-lg dark:bg-white dark:text-slate-950"
          >
            {coaching || premiumLoading ? <Hourglass className="animate-pulse" size={22} /> : <RefreshCw size={22} />}
          </button>
        </header>
        <div className="flex items-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-3 py-2 text-[11px] font-black uppercase tracking-wider text-cyan-700 dark:text-cyan-300">
          <Zap size={14} />
          {source === "ai" ? `Powered by AI (Gemini)${model ? ` - ${model}` : ""}` : "Powered by AI (Gemini) - local fallback active"}
        </div>

        <LevelCompanion totalXP={profile?.total_xp || 0} size="compact" mood="ready" characterId={profile?.avatar || "panda"} />

        <section className="rounded-2xl border border-cyan-200 bg-white p-5 shadow-sm dark:border-cyan-400/20 dark:bg-slate-900">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-cyan-500">Signal Quality</p>
              <h2 className="text-lg font-black">{readiness.label}</h2>
            </div>
            <div className="rounded-2xl bg-cyan-400/15 px-4 py-3 text-center text-cyan-700 dark:text-cyan-300">
              <p className="text-2xl font-black">{readiness.score}</p>
              <p className="text-[9px] font-black uppercase">Coach signal</p>
            </div>
          </div>
          <p className="text-sm font-bold leading-6 text-slate-600 dark:text-slate-300">{readiness.nextAction}</p>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="rounded-xl bg-slate-100 p-3 dark:bg-slate-950">
              <p className="text-lg font-black">{readiness.streak}</p>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Day chain</p>
            </div>
            <div className="rounded-xl bg-slate-100 p-3 dark:bg-slate-950">
              <p className="text-lg font-black">{readiness.todaySets}</p>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Today sets</p>
            </div>
            <div className="rounded-xl bg-slate-100 p-3 dark:bg-slate-950">
              <p className="text-lg font-black">{readiness.uniqueMoves}</p>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Signals</p>
            </div>
          </div>
        </section>

        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <BrainCircuit size={18} className="text-cyan-500" />
                <span className="text-xs font-black uppercase tracking-wider text-slate-500">{source === "ai" ? "Gemini basic coach" : "Basic coach"}</span>
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

        <section className="rounded-2xl border border-violet-300/40 bg-violet-50 p-5 shadow-sm dark:border-violet-400/30 dark:bg-violet-500/10">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <Crown size={18} className="text-violet-500" />
                <span className="text-xs font-black uppercase tracking-wider text-violet-700 dark:text-violet-200">Premium AI Analysis</span>
              </div>
              <h2 className="text-lg font-black">Personalized progression diagnostics</h2>
              <p className="mt-1 text-xs font-bold text-violet-800/80 dark:text-violet-200/80">
                {premiumLocked ? "Locked for free accounts" : premiumSource === "ai" ? "Generated by Gemini" : "Premium fallback analysis"}
              </p>
            </div>
            <div className="rounded-full bg-violet-500/10 p-3 text-violet-500">
              {premiumLocked ? <Lock size={20} /> : <Sparkles size={20} />}
            </div>
          </div>

          {premiumLocked ? (
            <div className="rounded-xl border border-dashed border-violet-400/40 bg-white/60 p-4 dark:bg-black/10">
              <p className="text-sm font-black text-violet-900 dark:text-violet-100">Premium unlock required</p>
              <p className="mt-2 text-xs font-bold leading-5 text-violet-800/90 dark:text-violet-200/90">
                Unlock Gemini analysis that reviews weak points, plateau risk, recovery load, and the next metric to compare after your next workout.
              </p>
              <div className="mt-4 grid gap-2 text-[10px] font-black uppercase tracking-wider text-violet-700 dark:text-violet-200">
                <span>Advanced bottleneck detection</span>
                <span>Priority-ranked next actions</span>
                <span>Recovery and progression risk flags</span>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {premiumError && <p className="rounded-xl bg-amber-50 p-3 text-xs font-bold text-amber-700 dark:bg-amber-400/10 dark:text-amber-300">{premiumError}</p>}
              <p className="text-sm font-bold leading-6 text-slate-700 dark:text-slate-200">{activePremiumAnalysis.summary}</p>

              <div>
                <p className="mb-2 text-xs font-black uppercase tracking-wider text-violet-700 dark:text-violet-200">Priorities</p>
                <div className="space-y-2">
                  {activePremiumAnalysis.priorities.map((priority, index) => (
                    <p key={`${priority}-${index}`} className="rounded-xl bg-white/70 p-3 text-sm font-bold leading-5 text-slate-700 dark:bg-slate-950/70 dark:text-slate-200">{priority}</p>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-black uppercase tracking-wider text-violet-700 dark:text-violet-200">Risk Flags</p>
                <div className="space-y-2">
                  {activePremiumAnalysis.risks.map((risk, index) => (
                    <p key={`${risk}-${index}`} className="rounded-xl bg-white/70 p-3 text-sm font-bold leading-5 text-slate-700 dark:bg-slate-950/70 dark:text-slate-200">{risk}</p>
                  ))}
                </div>
              </div>

              <div className="rounded-xl bg-cyan-50 p-4 text-sm font-black leading-6 text-cyan-800 dark:bg-cyan-400/10 dark:text-cyan-200">
                Next check-in: {activePremiumAnalysis.nextCheckIn}
              </div>
            </div>
          )}
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
