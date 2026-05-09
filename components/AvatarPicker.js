"use client";
import { motion } from "framer-motion";
import { CHARACTERS } from "@/lib/characters";
import CharacterPortrait from "@/components/CharacterPortrait";

export default function AvatarPicker({ selectedAvatar, onSelect }) {
  return (
    <div className="w-full max-w-md mx-auto">
      <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-4 text-center">
        Select your training character
      </h3>

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
              className={`relative flex items-center gap-3 rounded-2xl border p-3 text-left transition ${
                isSelected
                  ? "border-emerald-400 bg-emerald-400/10 shadow-lg shadow-emerald-500/10"
                  : "border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800"
              }`}
            >
              <CharacterPortrait characterId={character.id} size={42} className="border border-white/20" />
              <span>
                <span className="block font-black text-slate-900 dark:text-white">{character.name}</span>
                <span className="block text-[10px] font-black uppercase tracking-wider text-slate-500">{character.rank}</span>
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
