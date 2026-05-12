"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Script from "next/script";
import { supabase } from "@/lib/supabase";
import { ArrowRight, Download, Mail, ShieldCheck, Smartphone, Sparkles } from "lucide-react";
import { isAppRuntime } from "@/lib/runtimeMode";
import CleanCharacterImage from "@/components/CleanCharacterImage";

export default function HomePage() {
  const [appMode, setAppMode] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [authing, setAuthing] = useState(false);
  const [installPromptEvent, setInstallPromptEvent] = useState(null);
  const [installHint, setInstallHint] = useState("");
  const [installedMode, setInstalledMode] = useState(false);
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  useEffect(() => {
    setAppMode(isAppRuntime());
    const alreadyInstalled = window.matchMedia?.("(display-mode: standalone)")?.matches || window.navigator?.standalone;
    setInstalledMode(Boolean(alreadyInstalled));
    const onBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setInstallPromptEvent(event);
    };
    const onInstalled = () => {
      setInstallPromptEvent(null);
      setInstalledMode(true);
      setInstallHint("Installed. Check your app drawer/home screen for BJ Fit.");
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const handleInstallApp = async (event) => {
    event.preventDefault();
    setInstallHint("");
    if (installedMode) {
      setInstallHint("BJ Fit is already installed on this device.");
      return;
    }
    if (installPromptEvent) {
      installPromptEvent.prompt();
      const choice = await installPromptEvent.userChoice;
      if (choice?.outcome === "accepted") {
        setInstallHint("Install accepted. Android may take a moment before the icon appears.");
      } else {
        setInstallHint("Install canceled. You can try again anytime.");
      }
      setInstallPromptEvent(null);
      return;
    }
    setInstallHint("Install prompt unavailable right now. In Chrome: menu > Install app.");
  };

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
          <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-5 shadow-2xl">
            <div className="flex items-center gap-3">
              <img src="/icon.png" alt="BJ Fit" className="h-14 w-14 rounded-2xl" />
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-cyan-300">BJ Fit Showcase</p>
                <h1 className="text-3xl font-black">Install to train</h1>
              </div>
            </div>
            <p className="mt-4 text-sm font-semibold leading-6 text-slate-300">This web page is a preview. Full workout logging, character progression, and coaching are designed for the installed app experience.</p>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {["AI coach", "Daily quests", "Character shop"].map((label) => (
                <div key={label} className="rounded-xl bg-slate-950 px-3 py-2 text-center text-[10px] font-black uppercase tracking-wider text-slate-400">
                  {label}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/10 bg-slate-900 p-3">
              <CleanCharacterImage src="/characters/lion/body-elite.png" alt="Lion character preview" className="h-40 w-full rounded-xl bg-slate-950 object-contain p-2" />
              <p className="mt-2 text-xs font-black uppercase tracking-wider text-slate-400">Elite forms</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-900 p-3">
              <CleanCharacterImage src="/characters/shark/body-advanced.png" alt="Shark character preview" className="h-40 w-full rounded-xl bg-slate-950 object-contain p-2" />
              <p className="mt-2 text-xs font-black uppercase tracking-wider text-slate-400">Locker drops</p>
            </div>
          </div>

          <div className="mt-5 grid gap-3">
            <button onClick={handleInstallApp} className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-4 py-4 font-black text-slate-950">
              <Download size={18} /> Install BJ Fit
            </button>
            <button onClick={handleInstallApp} className="flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-4 font-black text-slate-950">
              <Smartphone size={18} /> Add to Home Screen
            </button>
            <a href="/?app=1" className="flex items-center justify-center gap-2 rounded-2xl border border-cyan-400/50 bg-cyan-400/10 px-4 py-4 font-black text-cyan-200">
              <Sparkles size={18} /> Enter App Preview Mode
            </a>
            {installHint && <p className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-slate-300">{installHint}</p>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-5 text-white">
      {googleClientId && <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" />}
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-4">
        <section className="rounded-3xl border border-white/10 bg-slate-900/65 p-6 shadow-2xl">
          <div className="flex items-center gap-4">
            <img src="/icon.png" alt="BJ Fit icon" className="h-16 w-16 rounded-2xl border border-white/15" />
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest text-cyan-300">Welcome</p>
              <h1 className="text-4xl font-black tracking-tight text-white">BJ Fit</h1>
              <p className="mt-1 text-xs font-bold text-slate-400">Choose a secure sign-in method.</p>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-900/55 p-6">
          <button onClick={handleGoogleLogin} disabled={authing || busy} className="flex w-full items-center justify-center gap-3 rounded-2xl bg-white py-4 font-black text-black disabled:opacity-60">
            <ShieldCheck size={18} />
            {authing ? "Opening Google..." : "Continue with Google"}
          </button>

          <div className="my-4 text-center text-xs font-black uppercase tracking-wider text-slate-500">or</div>
          <form onSubmit={handleEmailAuth} className="space-y-3">
            <div className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-950 px-3 py-3">
              <Mail size={18} className="text-slate-500" />
              <input value={email} onChange={(e) => setEmail(e.target.value)} className="min-w-0 flex-1 bg-transparent font-bold outline-none" placeholder="Email" type="email" required />
            </div>
            <input value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 font-bold outline-none focus:border-emerald-400" placeholder="Password" type="password" required />
            <button disabled={busy || authing} className="w-full rounded-xl bg-emerald-400 py-3 font-black text-slate-950 disabled:opacity-60">
              {busy ? "Processing..." : isLogin ? "Sign In with Email" : "Create Account with Email"}
            </button>
          </form>
          <button onClick={() => setIsLogin((v) => !v)} className="mt-3 w-full text-center text-sm font-bold text-cyan-300">
            {isLogin ? "Need an account? Sign up" : "Already have an account? Sign in"}
          </button>
          {message && <p className="mt-3 rounded-xl bg-red-400/10 p-3 text-center text-xs font-bold text-red-300">{message}</p>}
          <p className="mt-4 text-center text-[10px] font-bold uppercase tracking-wider text-slate-500">Google OAuth and email auth are handled by Supabase.</p>
        </section>

        <p className="text-center text-[10px] font-bold text-slate-500">
          By continuing, you agree to our <Link href="/terms" className="text-cyan-400">Terms</Link>, <Link href="/privacy" className="text-cyan-400">Privacy Policy</Link>, and <Link href="/data-deletion" className="text-cyan-400">Data Deletion Policy</Link>.
        </p>
      </div>
    </div>
  );
}
