"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Script from "next/script";

export default function Login() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [authing, setAuthing] = useState(false);
  const [gisRendered, setGisRendered] = useState(false);
  const [authMessage, setAuthMessage] = useState("");
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  useEffect(() => {
    const checkUser = async () => {
      try {
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((resolve) =>
          setTimeout(() => resolve({ data: { session: null }, error: new Error("session timeout") }), 4000)
        );
        const result = await Promise.race([sessionPromise, timeoutPromise]);
        const session = result?.data?.session ?? null;

        if (session) {
          router.replace("/dashboard");
          return;
        }
      } catch (error) {
        console.error("Session check failed:", error);
      } finally {
        setLoading(false);
      }
    };
    checkUser();
  }, [router]);

  useEffect(() => {
    if (!googleClientId || !window.google?.accounts?.id) return;

    window.google.accounts.id.initialize({
      client_id: googleClientId,
      callback: async (response) => {
        if (!response.credential) return;
        setAuthing(true);
        const { error } = await supabase.auth.signInWithIdToken({
          provider: "google",
          token: response.credential,
        });
        setAuthing(false);
        if (error) {
          alert(error.message);
          return;
        }
        router.replace("/dashboard");
      },
      ux_mode: "popup",
      auto_select: false,
      cancel_on_tap_outside: true,
    });

    const button = document.getElementById("google-native-button");
    if (button) {
      button.innerHTML = "";
      window.google.accounts.id.renderButton(button, {
        theme: "filled_black",
        size: "large",
        shape: "pill",
        text: "continue_with",
        width: Math.min(320, button.clientWidth || 320),
      });
      setGisRendered(true);
    }
  }, [googleClientId, router]);

  const handleGoogleLogin = async () => {
    setAuthMessage("");
    if (!googleClientId) {
      setAuthMessage("Google Sign-In is not configured yet. NEXT_PUBLIC_GOOGLE_CLIENT_ID is missing.");
      return;
    }
    setAuthing(true);
    setAuthMessage("Opening Google Sign-In...");
    try {
      const redirectTo = `${window.location.origin}/dashboard`;
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          queryParams: { prompt: "select_account" },
          skipBrowserRedirect: true,
        },
      });
      if (error) throw error;
      if (data?.url) {
        window.location.assign(data.url);
        return;
      }
      setAuthMessage("Google sign-in did not return an auth URL.");
    } catch (error) {
      setAuthMessage(error?.message || "Google sign-in failed to start.");
    } finally {
      setAuthing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 p-5 relative overflow-hidden">
      {googleClientId && <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" />}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-24 -left-10 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute top-1/3 -right-16 h-80 w-80 rounded-full bg-cyan-500/15 blur-3xl" />
        <div className="absolute -bottom-24 left-10 h-80 w-80 rounded-full bg-orange-400/20 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-5"
      >
        <section className="rounded-3xl border border-white/10 bg-slate-900/65 p-6 shadow-2xl backdrop-blur-md">
          <div className="flex items-center gap-4">
            <img src="/icon.png" alt="BJ Fit icon" className="h-16 w-16 rounded-2xl border border-white/15 shadow-xl" />
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest text-cyan-300">Welcome</p>
              <h1 className="text-4xl font-black tracking-tight text-white">BJ Fit</h1>
            </div>
          </div>
          <p className="mt-5 text-sm font-semibold leading-6 text-slate-300">
            Track workouts, level up your character, and keep your momentum with coaching that adapts as you train.
          </p>
          <p className="mt-3 text-xs font-bold uppercase tracking-wide text-cyan-200/90">
            Build your streak. Customize your character. Train with intent.
          </p>
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-900/55 p-6 shadow-2xl backdrop-blur-md">
          <div id="google-native-button" className="flex min-h-[44px] w-full justify-center" />
          {!gisRendered && (
            <button
              onClick={handleGoogleLogin}
              className="group relative mt-4 w-full flex items-center justify-center gap-3 rounded-2xl bg-white py-4 font-black text-black shadow-xl transition-all active:scale-95 hover:bg-slate-50"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 to-purple-400 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />
              <span className="relative z-10">Continue with Google</span>
              <ArrowRight size={18} className="relative z-10 ml-2 group-hover:translate-x-1 transition-transform" />
            </button>
          )}
          {authing && <p className="mt-4 text-center text-xs font-bold uppercase tracking-wider text-emerald-400">Signing in...</p>}
          {authMessage && <p className="mt-4 text-center text-xs font-bold text-red-400">{authMessage}</p>}

          <p className="mt-5 text-center text-[10px] font-bold uppercase tracking-widest leading-relaxed text-slate-500">
            Your streak, rewards, and character progress sync across devices.
          </p>
        </section>

        <div className="px-4">
          <p className="text-center text-[10px] font-bold tracking-wide text-slate-500">
            By continuing, you agree to our{" "}
            <Link href="/terms" className="text-cyan-400 hover:text-cyan-300">Terms</Link>,{" "}
            <Link href="/privacy" className="text-cyan-400 hover:text-cyan-300">Privacy Policy</Link>, and{" "}
            <Link href="/data-deletion" className="text-cyan-400 hover:text-cyan-300">Data Deletion Policy</Link>.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
