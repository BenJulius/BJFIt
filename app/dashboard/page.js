"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import { Activity, ArrowRight, Dumbbell, Flame, Loader2, LogIn, Plus, Shield, Sparkles, Trophy, UserCircle, UserPlus } from "lucide-react";
import LevelCompanion from "@/components/LevelCompanion";
import { getLevelState, getWorkoutSummary, getWorkoutVolume } from "@/lib/progression";
import { getCharacterState, getCharacterProgress, initializeCharacterProgress } from "@/lib/characterProgress";
import { getCharacterLevel, MAX_CHARACTER_LEVEL } from "@/lib/characters";
import InstallPrompt from "@/components/InstallPrompt";
import NotificationManager from "@/components/NotificationManager";
import { getEliteReadiness } from "@/lib/eliteStatus";

export default function Dashboard() {
  const [workouts, setWorkouts] = useState([]);
  const [profile, setProfile] = useState(null);
  const [userId, setUserId] = useState(null);
  const [characterState, setCharacterState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authStatus, setAuthStatus] = useState("authenticated");

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !session) {
          if (isMounted) {
            setAuthStatus("unauthenticated");
            setLoading(false);
          }
          return;
        }

        const { data: profileData, error: profileError } = await supabase.from("profiles").select("*").eq("id", session.user.id).maybeSingle();

        if (profileError || !profileData) {
          if (isMounted) {
            setAuthStatus("needs_onboarding");
            setLoading(false);
          }
          return;
        }

        const { data: workoutsData } = await supabase.from("workouts").select("*").order("created_at", { ascending: false });

        if (isMounted) {
          setUserId(session.user.id);
          setProfile(profileData);
          setCharacterState(initializeCharacterProgress(session.user.id, profileData.avatar || "panda"));
          setWorkouts(workoutsData || []);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setAuthStatus("unauthenticated");
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!userId) return;
    const syncProgress = () => setCharacterState(getCharacterState(userId));
    window.addEventListener("character-progress-change", syncProgress);
    return () => window.removeEventListener("character-progress-change", syncProgress);
  }, [userId]);

  const summary = useMemo(() => getWorkoutSummary(workouts), [workouts]);
  const levelState = useMemo(() => getLevelState(profile?.total_xp || 0), [profile?.total_xp]);
  const recentWorkouts = workouts.slice(0, 4);
  const todayWorkouts = useMemo(() => workouts.filter((workout) => String(workout.created_at || "").startsWith(new Date().toISOString().slice(0, 10))), [workouts]);
  const topExercises = useMemo(() => {
    const tally = workouts.reduce((acc, workout) => {
      if (!workout.exercise) return acc;
      acc[workout.exercise] = (acc[workout.exercise] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(tally).sort((a, b) => b[1] - a[1]).slice(0, 4);
  }, [workouts]);
  const todayVolume = useMemo(() => todayWorkouts.reduce((sum, workout) => sum + getWorkoutVolume(workout), 0), [todayWorkouts]);
  const bestVolumeSet = useMemo(() => [...workouts].sort((a, b) => getWorkoutVolume(b) - getWorkoutVolume(a))[0], [workouts]);
  const questProgress = Math.min(100, Math.round((Math.min(summary.totalSets, 12) / 12) * 100));
  const activeCharacterId = profile?.avatar || "panda";
  const activeProgress = userId ? getCharacterProgress(userId, activeCharacterId) : { xp: 0, equipped: [] };
  const activeCharacterLevel = getCharacterLevel(activeProgress.xp);
  const readiness = useMemo(() => getEliteReadiness(workouts, profile || {}), [workouts, profile]);

  const forceHardLoginRedirect = async () => {
    await supabase.auth.signOut();
    localStorage.clear();
    window.location.href = "/";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <Loader2 className="animate-spin text-emerald-400 w-8 h-8" />
      </div>
    );
  }

  if (authStatus === "unauthenticated") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 p-6 text-center">
        <UserCircle className="w-16 h-16 text-slate-700 mb-4" />
        <h2 className="text-xl font-black text-white mb-2">Session expired</h2>
        <p className="text-slate-400 mb-8 max-w-xs">Sign in again to get back to your training arc.</p>
        <button onClick={forceHardLoginRedirect} className="flex items-center gap-2 bg-emerald-400 text-slate-950 px-6 py-3 rounded-xl font-black">
          <LogIn size={18} /> Return to Login
        </button>
      </div>
    );
  }

  if (authStatus === "needs_onboarding") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 p-6 text-center">
        <UserPlus className="w-16 h-16 text-emerald-400 mb-4" />
        <h2 className="text-xl font-black text-white mb-2">Profile missing</h2>
        <p className="text-slate-400 mb-8 max-w-xs">Build your athlete profile before the first quest starts.</p>
        <Link href="/onboarding" className="flex items-center gap-2 bg-emerald-400 text-slate-950 px-6 py-3 rounded-xl font-black">
          Complete Setup
        </Link>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-slate-100 px-4 pb-32 pt-6 text-slate-950 dark:bg-slate-950 dark:text-white">
      <div className="mx-auto max-w-md space-y-4">
        <motion.header initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-emerald-500">Workout Quest</p>
            <h1 className="mt-1 text-3xl font-black tracking-tight">{profile.username ? `@${profile.username}` : "Athlete"}</h1>
          </div>
          <Link href="/log" className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/25">
            <Plus size={24} />
          </Link>
        </motion.header>

        <LevelCompanion
          totalXP={profile.total_xp || 0}
          mood={questProgress >= 100 ? "celebrate" : "ready"}
          characterId={activeCharacterId}
          characterXP={activeProgress.xp}
          equipped={activeProgress.equipped}
        />

        <section className="rounded-2xl border border-emerald-200 bg-white p-4 shadow-sm dark:border-emerald-400/20 dark:bg-slate-900">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-emerald-500">Command Center</p>
              <h2 className="text-lg font-black">{readiness.label}</h2>
            </div>
            <div className="flex h-14 w-14 flex-col items-center justify-center rounded-2xl bg-emerald-400/15 text-emerald-600 dark:text-emerald-300">
              <span className="text-xl font-black">{readiness.score}</span>
              <span className="text-[9px] font-black uppercase">Ready</span>
            </div>
          </div>
          <p className="text-sm font-bold leading-5 text-slate-600 dark:text-slate-300">{readiness.nextAction}</p>
          <div className="mt-3 grid grid-cols-4 gap-2">
            {[
              ["Streak", `${readiness.streak}d`],
              ["Today", readiness.todaySets],
              ["Moves", readiness.uniqueMoves],
              ["Volume", Math.round(todayVolume)],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl bg-slate-100 p-2 dark:bg-slate-950">
                <p className="text-base font-black">{value}</p>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">{label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid grid-cols-4 gap-2">
          {[
            { label: "Level", value: levelState.level, icon: Trophy },
            { label: "Sets", value: summary.totalSets, icon: Dumbbell },
            { label: "Days", value: summary.activeDays, icon: Activity },
            { label: "Today", value: todayWorkouts.length, icon: Flame },
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-slate-900">
              <stat.icon size={16} className="mb-2 text-emerald-500" />
              <p className="text-xl font-black">{stat.value}</p>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">{stat.label}</p>
            </div>
          ))}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-900">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black">Character Growth</h2>
              <p className="text-sm font-medium text-slate-500">Daily logs level this character only.</p>
            </div>
            <div className="rounded-full bg-amber-400/15 px-3 py-1 text-xs font-black text-amber-600 dark:text-amber-300">
              {characterState?.tokens || 0} tokens
            </div>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
            <motion.div initial={{ width: 0 }} animate={{ width: `${Math.round((activeCharacterLevel / MAX_CHARACTER_LEVEL) * 100)}%` }} className="h-full rounded-full bg-gradient-to-r from-amber-400 to-emerald-400" />
          </div>
          <div className="mt-3 flex justify-between text-xs font-black uppercase tracking-wider text-slate-500">
            <span>Character Lv {activeCharacterLevel}</span>
            <span>Max {MAX_CHARACTER_LEVEL}</span>
          </div>
        </section>

        <NotificationManager compact />
        <InstallPrompt compact />

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-900">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black">Daily Quest</h2>
              <p className="text-sm font-medium text-slate-500">Complete 12 sets to bank the day.</p>
            </div>
            <Shield className="text-cyan-500" size={24} />
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
            <motion.div initial={{ width: 0 }} animate={{ width: `${questProgress}%` }} className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400" />
          </div>
          <div className="mt-3 flex justify-between text-xs font-black uppercase tracking-wider text-slate-500">
            <span>{Math.min(summary.totalSets, 12)} / 12 sets</span>
            <span>{questProgress}%</span>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-900">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-black">Next Move</h2>
            <Sparkles size={20} className="text-amber-400" />
          </div>
          <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
            {bestVolumeSet
              ? `Your strongest recent set is ${bestVolumeSet.exercise} at ${bestVolumeSet.weight} lbs x ${bestVolumeSet.reps}. Try to match the reps, then add a small load jump.`
              : "Log your first exercise and the coach will turn it into a progression target."}
          </p>
          <Link href="/insights" className="mt-4 flex items-center justify-between rounded-xl bg-slate-950 px-4 py-3 text-sm font-black text-white dark:bg-white dark:text-slate-950">
            Open AI Coach <ArrowRight size={18} />
          </Link>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-900">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-black">Most Used Exercises</h2>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Frequency</span>
          </div>
          {topExercises.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-4 text-center text-sm font-bold text-slate-500 dark:border-slate-700">
              Log sessions to surface movement patterns.
            </div>
          ) : (
            <div className="space-y-2">
              {topExercises.map(([exercise, count]) => (
                <div key={exercise} className="flex items-center justify-between rounded-xl bg-slate-100 px-3 py-2 dark:bg-slate-950">
                  <p className="font-black">{exercise}</p>
                  <span className="text-xs font-black text-slate-500">{count} sets</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-900">
          <h2 className="mb-4 text-lg font-black">Recent Sets</h2>
          {recentWorkouts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-5 text-center text-sm font-bold text-slate-500 dark:border-slate-700">
              No sets yet. Start a workout to wake up the tracker.
            </div>
          ) : (
            <div className="space-y-3">
              {recentWorkouts.map((workout) => (
                <Link key={workout.id} href={`/exercise/${encodeURIComponent(workout.exercise)}`} className="flex items-center justify-between rounded-xl bg-slate-100 p-4 dark:bg-slate-950">
                  <div>
                    <p className="font-black">{workout.exercise}</p>
                    <p className="text-xs font-bold text-slate-500">{new Date(workout.created_at).toLocaleDateString()}</p>
                  </div>
                  <p className="text-sm font-black text-emerald-500">{workout.weight} x {workout.reps}</p>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
