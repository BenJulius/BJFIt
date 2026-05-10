"use client";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import BottomNav from "@/components/BottomNav";
import RewardToasts from "@/components/RewardToasts";
import { isAppRuntime } from "@/lib/runtimeMode";

const PUBLIC_PATHS = new Set(["/", "/login", "/onboarding", "/terms", "/privacy", "/data-deletion"]);

export default function AppShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [appRuntime, setAppRuntime] = useState(false);
  const isPublic = useMemo(() => PUBLIC_PATHS.has(pathname), [pathname]);

  useEffect(() => {
    setAppRuntime(isAppRuntime());
    const isLocalHost =
      typeof window !== "undefined" &&
      (window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost");

    // Prevent stale PWA service workers/caches from breaking localhost rendering.
    if (isLocalHost && typeof navigator !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => registration.unregister());
      }).catch(() => {});
      if (typeof caches !== "undefined") {
        caches.keys().then((keys) => Promise.all(keys.map((key) => caches.delete(key)))).catch(() => {});
      }
    }

    let active = true;

    const loadSession = async () => {
      try {
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((resolve) =>
          setTimeout(() => resolve({ data: { session: null }, error: new Error("session timeout") }), 4000)
        );
        const result = await Promise.race([sessionPromise, timeoutPromise]);
        if (!active) return;

        const nextSession = result?.data?.session || null;
        setSession(nextSession);
        if (!nextSession && !PUBLIC_PATHS.has(pathname)) {
          router.replace("/");
        }
      } catch (error) {
        if (!active) return;
        console.error("AppShell session load failed:", error);
        setSession(null);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession || null);
      setLoading(false);
      if (!nextSession && !PUBLIC_PATHS.has(pathname)) {
        router.replace("/");
      }
    });

    return () => {
      active = false;
      authListener.subscription.unsubscribe();
    };
  }, [pathname, router]);

  const showProtectedLoader = loading && !isPublic;
  const blockProtectedRoute = !loading && (!session || !appRuntime) && !isPublic;
  const showNav = Boolean(session) && !isPublic;

  return (
    <div className="w-full max-w-md h-screen relative bg-slate-950 shadow-2xl overflow-hidden flex flex-col">
      <main className={`flex-1 overflow-y-auto relative z-10 ${showNav ? "pb-24" : "pb-0"}`}>
        {showProtectedLoader || blockProtectedRoute ? (
          <div className="flex min-h-screen items-center justify-center bg-slate-950">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
          </div>
        ) : children}
      </main>
      {showNav && <BottomNav />}
      <RewardToasts />
    </div>
  );
}
