"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Script from "next/script";
import { supabase } from "@/lib/supabase";
import { ArrowRight, Download, Smartphone, Sparkles } from "lucide-react";
import { isAppRuntime } from "@/lib/runtimeMode";

export default function HomePage() {
  const [appMode, setAppMode] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [authing, setAuthing] = useState(false);
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  useEffect(() => {
    setAppMode(isAppRuntime());
  }, []);

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        window.location.href = "/dashboard?app=1";
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        window.location.href = "/onboarding?app=1";
      }
    } catch (error) {
      setMessage(error?.message || "Auth failed.");
    } finally {
      setBusy(false);
    }
  };

  const handleGoogleLogin = async () => {
    setAuthing(true);
    setMessage("");
    try {
      const redirectTo = `${window.location.origin}/dashboard?app=1`;
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo, queryParams: { prompt: "select_account" }, skipBrowserRedirect: true },
      });
      if (error) throw error;
      if (data?.url) window.location.assign(data.url);
    } catch (error) {
      setMessage(error?.message || "Google login failed.");
      setAuthing(false);
    }
  };

  if (!appMode) {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <div className="mx-auto max-w-md p-6 pb-16">
          <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-5">
            <div className="flex items-center gap-3">
              <img src="/icon.png" alt="BJ Fit" className="h-14 w-14 rounded-2xl" />
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-cyan-300">BJ Fit App</p>
                <h1 className="text-3xl font-black">Train In-App</h1>
              </div>
            </div>
            <p className="mt-4 text-sm font-semibold text-slate-300">BJ Fit is app-first. Download to access workout logging, character progression, and AI coaching.</p>
          </div>

          <div className="mt-4 grid gap-3">
            <img src="/characters/lion/body-elite.png" alt="app preview 1" className="h-44 w-full rounded-2xl border border-white/10 bg-slate-900 object-contain p-2" />
            <img src="/characters/shark/body-advanced.png" alt="app preview 2" className="h-44 w-full rounded-2xl border border-white/10 bg-slate-900 object-contain p-2" />
          </div>

          <div className="mt-5 grid gap-3">
            <a href="#" className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-4 py-4 font-black text-slate-950">
              <Download size={18} /> Download on Google Play
            </a>
            <a href="#" className="flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-4 font-black text-slate-950">
              <Smartphone size={18} /> Download on App Store
            </a>
            <a href="/?app=1" className="flex items-center justify-center gap-2 rounded-2xl border border-cyan-400/50 bg-cyan-400/10 px-4 py-4 font-black text-cyan-200">
              <Sparkles size={18} /> Enter Android Test Mode
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-5 text-white">
      {googleClientId && <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" />}
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-4">
        <section className="rounded-3xl border border-white/10 bg-slate-900/65 p-6">
          <div className="flex items-center gap-4">
            <img src="/icon.png" alt="BJ Fit icon" className="h-16 w-16 rounded-2xl border border-white/15" />
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest text-cyan-300">Welcome</p>
              <h1 className="text-4xl font-black tracking-tight text-white">BJ Fit</h1>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-900/55 p-6">
          <button onClick={handleGoogleLogin} className="w-full rounded-2xl bg-white py-4 font-black text-black">
            {authing ? "Signing in..." : "Continue with Google"}
          </button>

          <div className="my-4 text-center text-xs font-black uppercase tracking-wider text-slate-500">or</div>
          <form onSubmit={handleEmailAuth} className="space-y-3">
            <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 font-bold" placeholder="Email" type="email" required />
            <input value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 font-bold" placeholder="Password" type="password" required />
            <button disabled={busy} className="w-full rounded-xl bg-emerald-400 py-3 font-black text-slate-950">
              {busy ? "Processing..." : isLogin ? "Sign In with Email" : "Create Account with Email"}
            </button>
          </form>
          <button onClick={() => setIsLogin((v) => !v)} className="mt-3 w-full text-center text-sm font-bold text-cyan-300">
            {isLogin ? "Need an account? Sign up" : "Already have an account? Sign in"}
          </button>
          {message && <p className="mt-3 text-center text-xs font-bold text-red-400">{message}</p>}
        </section>

        <p className="text-center text-[10px] font-bold text-slate-500">
          By continuing, you agree to our <Link href="/terms" className="text-cyan-400">Terms</Link>, <Link href="/privacy" className="text-cyan-400">Privacy Policy</Link>, and <Link href="/data-deletion" className="text-cyan-400">Data Deletion Policy</Link>.
        </p>
      </div>
    </div>
  );
}

