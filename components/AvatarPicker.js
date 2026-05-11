"use client";
import { motion } from "framer-motion";
import { CHARACTERS } from "@/lib/characters";
import CharacterPortrait from "@/components/CharacterPortrait";
import { CheckCircle2 } from "lucide-react";

export default function AvatarPicker({ selectedAvatar, onSelect }) {
  return (
    <div className="w-full max-w-md mx-auto">
      <div className="mb-4 text-center">
        <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-widest">
          Select your training character
        </h3>
        <p className="mt-1 text-xs font-bold text-slate-400">Each character has its own locker, rank, and progression arc.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {Object.values(CHARACTERS).map((character) => {
          const isSelected = selectedAvatar === character.id;

          return (
            <motion.button
              key={character.id}
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelect(character.id)}
              className={`relative flex items-center gap-3 overflow-hidden rounded-2xl border p-3 text-left transition ${
                isSelected
                  ? "border-emerald-400 bg-emerald-400/10 shadow-lg shadow-emerald-500/10"
                  : "border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800"
              }`}
              style={{ boxShadow: isSelected ? `0 14px 30px ${character.accent}18` : undefined }}
            >
              <span className="absolute inset-y-0 left-0 w-1" style={{ backgroundColor: character.accent }} />
              <CharacterPortrait characterId={character.id} size={42} className="border border-white/20" />
              <span className="min-w-0 flex-1">
                <span className="block font-black text-slate-900 dark:text-white">{character.name}</span>
                <span className="block text-[10px] font-black uppercase tracking-wider text-slate-500">{character.rank}</span>
              </span>
              {isSelected && <CheckCircle2 size={18} className="shrink-0 text-emerald-400" />}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
