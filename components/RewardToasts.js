"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Coins, Sparkles, Trophy, X } from "lucide-react";

export default function RewardToasts() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const pushToast = (toast) => {
      const id = `${Date.now()}-${Math.random()}`;
      setToasts((prev) => [...prev, { ...toast, id }].slice(-3));
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((item) => item.id !== id));
      }, 5200);
    };

    const onReward = (event) => {
      pushToast({
        icon: Coins,
        title: "Daily training token earned",
        body: `+${event.detail.tokens} token and +${event.detail.characterXP} character level progress`,
        color: "text-amber-300",
      });
    };

    const onUpgrade = (event) => {
      pushToast({
        icon: Trophy,
        title: `${event.detail.upgrade.name} unlocked`,
        body: "Your character equipped a new training upgrade.",
        color: "text-emerald-300",
      });
    };

    window.addEventListener("character-reward-earned", onReward);
    window.addEventListener("character-upgrade-earned", onUpgrade);
    return () => {
      window.removeEventListener("character-reward-earned", onReward);
      window.removeEventListener("character-upgrade-earned", onUpgrade);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[80] mx-auto flex max-w-md flex-col gap-3 px-4">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -18, scale: 0.96 }}
            className="pointer-events-auto overflow-hidden rounded-2xl border border-white/10 bg-slate-950/95 p-4 text-white shadow-2xl backdrop-blur"
          >
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-300 via-emerald-300 to-cyan-300" />
            <div className="flex gap-3">
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 ${toast.color}`}>
                <toast.icon size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Sparkles size={14} className="text-amber-300" />
                  <p className="font-black">{toast.title}</p>
                </div>
                <p className="mt-1 text-sm font-bold leading-5 text-slate-300">{toast.body}</p>
              </div>
              <button type="button" onClick={() => setToasts((prev) => prev.filter((item) => item.id !== toast.id))} className="text-slate-500 hover:text-white">
                <X size={16} />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
