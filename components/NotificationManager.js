"use client";
import { useEffect, useState } from "react";
import { Bell, BellRing } from "lucide-react";
import { supabase } from "@/lib/supabase";

const ENABLED_KEY = "bj-fit-reminders-enabled";
const LAST_SENT_KEY = "bj-fit-last-reminder-sent";

function canNotify() {
  return typeof window !== "undefined" && "Notification" in window;
}

export default function NotificationManager({ compact = false }) {
  const [enabled, setEnabled] = useState(false);
  const [permission, setPermission] = useState("default");

  useEffect(() => {
    if (!canNotify()) return;
    setEnabled(window.localStorage.getItem(ENABLED_KEY) === "true");
    setPermission(Notification.permission);
  }, []);

  useEffect(() => {
    if (!enabled || permission !== "granted" || !canNotify()) return;

    const checkWorkoutAge = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("workouts")
        .select("created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);

      const lastWorkoutAt = data?.[0]?.created_at ? new Date(data[0].created_at).getTime() : 0;
      const over24Hours = !lastWorkoutAt || Date.now() - lastWorkoutAt > 24 * 60 * 60 * 1000;
      const todayKey = new Date().toISOString().slice(0, 10);
      const lastSent = window.localStorage.getItem(LAST_SENT_KEY);

      if (over24Hours && lastSent !== todayKey) {
        new Notification("BJ Fit check-in", {
          body: "You haven't logged a workout in over 24 hours. Is everything okay?",
          icon: "/icon.svg",
          badge: "/maskable-icon.svg",
        });
        window.localStorage.setItem(LAST_SENT_KEY, todayKey);
      }
    };

    checkWorkoutAge();
  }, [enabled, permission]);

  const enable = async () => {
    if (!canNotify()) return;
    const nextPermission = await Notification.requestPermission();
    setPermission(nextPermission);
    if (nextPermission === "granted") {
      window.localStorage.setItem(ENABLED_KEY, "true");
      setEnabled(true);
    }
  };

  const disable = () => {
    window.localStorage.removeItem(ENABLED_KEY);
    setEnabled(false);
  };

  if (!canNotify()) return null;

  return (
    <div className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-900 ${compact ? "" : "space-y-3"}`}>
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400/15 text-amber-500">
          {enabled ? <BellRing size={20} /> : <Bell size={20} />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-black text-slate-900 dark:text-white">Workout reminders</p>
          <p className="text-xs font-bold text-slate-500">{enabled ? "24-hour check-ins are active." : "Get a check-in if you miss a day."}</p>
        </div>
        <button
          type="button"
          onClick={enabled ? disable : enable}
          className="rounded-xl bg-slate-950 px-3 py-2 text-xs font-black uppercase tracking-wider text-white dark:bg-white dark:text-slate-950"
        >
          {enabled ? "Off" : "Enable"}
        </button>
      </div>
      {!compact && permission === "denied" && (
        <p className="text-xs font-bold leading-5 text-red-500">Notifications are blocked in browser settings.</p>
      )}
    </div>
  );
}
