"use client";
import { useEffect, useState } from "react";
import { Download, Smartphone } from "lucide-react";

export default function InstallPrompt({ compact = false }) {
  const [promptEvent, setPromptEvent] = useState(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const onBeforeInstall = (event) => {
      event.preventDefault();
      setPromptEvent(event);
    };
    const onInstalled = () => {
      setInstalled(true);
      setPromptEvent(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    setInstalled(window.matchMedia?.("(display-mode: standalone)")?.matches || navigator.standalone === true);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = async () => {
    if (!promptEvent) return;
    promptEvent.prompt();
    await promptEvent.userChoice;
    setPromptEvent(null);
  };

  if (installed) return null;

  return (
    <div className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-900 ${compact ? "" : "space-y-3"}`}>
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/15 text-cyan-500">
          <Smartphone size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-black text-slate-900 dark:text-white">Install BJ Fit</p>
          <p className="text-xs font-bold text-slate-500">Use it like a native app from your home screen.</p>
        </div>
        <button
          type="button"
          onClick={install}
          disabled={!promptEvent}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-white disabled:opacity-40 dark:bg-white dark:text-slate-950"
          title={promptEvent ? "Install app" : "Install prompt appears after browser eligibility checks"}
        >
          <Download size={18} />
        </button>
      </div>
      {!promptEvent && !compact && (
        <p className="text-xs font-bold leading-5 text-slate-500">
          On mobile Chrome, use the browser menu and choose install if the button is disabled.
        </p>
      )}
    </div>
  );
}
