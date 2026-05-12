"use client";
import { motion } from "framer-motion";
import { Crown, Flame } from "lucide-react";
import { getLevelState } from "@/lib/progression";
import { getCharacter, getCharacterLevel, getCharacterShop, getPhysiqueStage, MAX_CHARACTER_LEVEL } from "@/lib/characters";
import { getCharacterVisuals } from "@/lib/characterVisuals";
import { useState } from "react";
import CleanCharacterImage from "@/components/CleanCharacterImage";

export default function LevelCompanion({
  totalXP = 0,
  size = "large",
  mood = "ready",
  characterId = "panda",
  characterXP,
  equipped = [],
}) {
  const accountLevel = getLevelState(totalXP);
  const character = getCharacter(characterId);
  const characterLevel = getCharacterLevel(characterXP ?? accountLevel.level);
  const physique = getPhysiqueStage(characterLevel);
  const compact = size === "compact";
  const shellSize = compact ? "h-44" : "h-80";
  const bodyWidth = 72 + physique * 8;
  const bodyX = 90 - bodyWidth / 2;
  const armWidth = 13 + physique * 2;
  const chestWidth = 48 + physique * 8;
  const quadWidth = 16 + physique * 2;
  const progressPercent = Math.min(100, Math.round((characterLevel / MAX_CHARACTER_LEVEL) * 100));
  const equippedItems = Object.values(getCharacterShop(characterId)).flat().filter((item) => equipped.includes(item.id));
  const equippedSlots = new Set(equippedItems.flatMap((item) => item.equips || []));
  const topItem = equippedItems.find((item) => item.equips?.includes("shirt"));
  const wrapItem = equippedItems.find((item) => item.equips?.includes("wraps"));
  const hatItem = equippedItems.find((item) => item.equips?.some((slot) => slot === "hat" || slot === "crown"));
  const auraItem = equippedItems.find((item) => item.equips?.includes("aura"));
  const hasShirt = equippedSlots.has("shirt");
  const hasWraps = equippedSlots.has("wraps");
  const hasAura = equippedSlots.has("aura");
  const traits = character.traits || {};
  const visuals = getCharacterVisuals(characterId, characterLevel);
  const [imageModeFailed, setImageModeFailed] = useState(false);

  return (
    <div className={`character-stage relative ${shellSize} w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 text-white shadow-xl dark:border-white/10`}>
      <div className="absolute inset-0 bg-slate-950" />
      <div className="absolute inset-0" style={{ background: `radial-gradient(circle at 50% 35%, ${character.accent}30, transparent 34%), linear-gradient(135deg, ${character.accent}55, #020617 58%, ${character.dark}55)` }} />
      {hasAura && <motion.div animate={{ opacity: [0.2, 0.55, 0.2], scale: [0.96, 1.06, 0.96] }} transition={{ repeat: Infinity, duration: 2.2 }} className="absolute inset-8 rounded-full blur-2xl" style={{ backgroundColor: auraItem?.color || character.accent }} />}
      <div className="absolute inset-x-6 bottom-5 h-12 rounded-full bg-black/30 blur-xl" />

      <div className="absolute left-4 top-4 z-20 flex items-center gap-2 rounded-full border border-white/10 bg-black/25 px-3 py-1.5 backdrop-blur-md">
        <Crown size={14} className="text-amber-300" />
        <span className="text-xs font-black uppercase tracking-wider">Lv {characterLevel}</span>
      </div>

      <div className="absolute right-4 top-4 z-20 flex items-center gap-2 rounded-full border border-white/10 bg-black/25 px-3 py-1.5 backdrop-blur-md">
        <Flame size={14} style={{ color: character.accent }} />
        <span className="text-xs font-black uppercase tracking-wider">{character.name}</span>
      </div>

      <motion.div
        animate={{ rotate: [-1.2, 1.2, -1.2], x: [-2, 2, -2], scale: [1, 1.01, 1] }}
        transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
        className={`absolute left-1/2 ${compact ? "bottom-2 w-36" : "bottom-3 w-52"} -translate-x-1/2`}
      >
        {!imageModeFailed && (
          <div className="relative">
          <div className="absolute inset-x-8 bottom-4 top-8 rounded-full" style={{ background: `radial-gradient(circle, ${character.accent}1f, transparent 66%)` }} />
          <CleanCharacterImage
            src={visuals.body}
            alt={`${character.name} body`}
            className="relative h-full w-full object-contain drop-shadow-2xl"
            onError={() => setImageModeFailed(true)}
          />
          </div>
        )}
        {imageModeFailed && (
        <svg viewBox="0 0 200 240" className="h-full w-full drop-shadow-2xl" role="img" aria-label={`${character.name} training companion`}>
          <motion.path d="M72 178 C62 199 58 214 63 226 C74 230 84 219 88 198" fill="none" stroke={character.accent} strokeWidth={quadWidth} strokeLinecap="round" animate={{ rotate: [-4, 5, -4] }} style={{ transformOrigin: "70px 174px" }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} />
          <motion.path d="M128 178 C138 199 142 214 137 226 C126 230 116 219 112 198" fill="none" stroke={character.accent} strokeWidth={quadWidth} strokeLinecap="round" animate={{ rotate: [4, -5, 4] }} style={{ transformOrigin: "110px 174px" }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} />
          <path d="M62 221 L90 221" stroke={traits.legs === "hoof" ? "#111827" : character.dark} strokeWidth={traits.legs === "talon" ? "5" : "8"} strokeLinecap="round" />
          <path d="M110 221 L138 221" stroke={traits.legs === "hoof" ? "#111827" : character.dark} strokeWidth={traits.legs === "talon" ? "5" : "8"} strokeLinecap="round" />
          {traits.legs === "talon" && <path d="M51 210 l-8 5 M62 211 l-4 8 M103 211 l-4 8 M128 210 l8 5" stroke={character.accent} strokeWidth="4" strokeLinecap="round" />}
          {traits.legs === "hoof" && <path d="M55 207 L75 207 M105 207 L125 207" stroke="#f8fafc" strokeWidth="3" strokeLinecap="round" />}
          <motion.path d="M66 116 C46 123 34 135 29 154" fill="none" stroke={character.fur} strokeWidth={armWidth} strokeLinecap="round" animate={{ rotate: mood === "celebrate" ? [-6, 18, -6] : [-3, 5, -3] }} style={{ transformOrigin: "66px 118px" }} transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }} />
          <motion.circle cx="39" cy="150" r={11 + physique * 1.6} fill={character.fur} animate={{ scale: mood === "celebrate" ? [1, 1.12, 1] : [1, 1.04, 1] }} transition={{ duration: 1.6, repeat: Infinity }} />
          <motion.path d="M134 116 C154 123 166 135 171 154" fill="none" stroke={character.fur} strokeWidth={armWidth} strokeLinecap="round" animate={{ rotate: mood === "celebrate" ? [6, -18, 6] : [3, -5, 3] }} style={{ transformOrigin: "134px 118px" }} transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }} />
          <motion.circle cx="161" cy="150" r={11 + physique * 1.6} fill={character.fur} animate={{ scale: mood === "celebrate" ? [1, 1.12, 1] : [1, 1.04, 1] }} transition={{ duration: 1.6, repeat: Infinity }} />
          {hasWraps && (<><circle cx="24" cy="133" r="8" fill={wrapItem?.color || character.accent} /><circle cx="156" cy="133" r="8" fill={wrapItem?.color || character.accent} /></>)}
          {traits.tail === "tuft" && <path d="M126 154 C158 148 158 178 134 174" fill="none" stroke={character.dark} strokeWidth="8" strokeLinecap="round" />}
          {traits.tail === "fin" && <path d="M126 147 L166 129 L154 164 Z" fill={character.fur} opacity="0.9" />}
          {traits.tail === "long" && <path d="M126 154 C165 160 174 191 144 194" fill="none" stroke={character.fur} strokeWidth="12" strokeLinecap="round" />}
          {traits.tail === "feathers" && <path d="M124 150 L158 138 L151 172 Z" fill={character.dark} opacity="0.85" />}
          {traits.tail === "stinger" && <path d="M126 150 C160 124 167 160 145 168 M145 168 L160 174" fill="none" stroke={character.dark} strokeWidth="8" strokeLinecap="round" />}
          <defs><linearGradient id={`skin-${character.id}`} x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#f8d8be" /><stop offset="100%" stopColor="#d9a986" /></linearGradient></defs>
          <path d={`M${bodyX} 92 C${bodyX} 76 ${bodyX + bodyWidth} 76 ${bodyX + bodyWidth} 92 L${bodyX + bodyWidth - 2} 170 C120 190 80 190 ${bodyX + 2} 170 Z`} fill={`url(#skin-${character.id})`} />
          <path d={`M${bodyX + 2} 118 C78 132 122 132 ${bodyX + bodyWidth - 2} 118 L${bodyX + bodyWidth - 6} 164 C120 176 80 176 ${bodyX + 6} 164 Z`} fill={hasShirt ? (topItem?.color || character.shirt) : character.dark} opacity="0.95" />
          {hasShirt && <path d={`M${bodyX + 10} 118 C76 130 104 130 ${bodyX + bodyWidth - 10} 118`} stroke="#ffffff" strokeWidth="4" strokeLinecap="round" opacity="0.7" />}
          <path d={`M${100 - chestWidth / 2} 126 C86 114 114 114 ${100 + chestWidth / 2} 126`} stroke="#ffffff" strokeWidth={3 + physique} strokeLinecap="round" opacity={0.35 + physique * 0.08} />
          {physique >= 1 && <path d="M82 139 L118 139" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" opacity="0.5" />}
          {physique >= 2 && <path d="M86 152 L114 152" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" opacity="0.5" />}
          {physique >= 2 && <path d="M84 165 L116 165" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" opacity="0.42" />}
          {physique >= 3 && <path d="M100 124 L100 172" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" opacity="0.45" />}
          {physique >= 3 && <path d="M78 122 C88 134 90 150 86 170 M122 122 C112 134 110 150 114 170" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" opacity="0.35" />}
          {physique >= 4 && <path d="M66 101 C78 93 102 93 114 101" stroke={character.accent} strokeWidth="7" strokeLinecap="round" />}
          <circle cx="100" cy="58" r="38" fill={character.fur} />
          {character.id === "lion" && <circle cx="100" cy="58" r="45" fill={character.dark} opacity="0.85" />}
          {character.id === "lion" && <circle cx="100" cy="58" r="35" fill={character.fur} />}
          {traits.head === "shark" && <><path d="M100 10 L116 33 L84 33 Z" fill={character.fur} /><path d="M62 62 L41 52 L62 44 Z" fill={character.fur} /><path d="M138 62 L159 52 L138 44 Z" fill={character.fur} /></>}
          {traits.head === "gator" && <path d="M56 62 C70 45 110 45 136 62 C119 76 74 76 56 62 Z" fill={character.fur} stroke={character.dark} strokeWidth="3" />}
          {traits.head === "beak" && <path d="M86 64 L118 71 L88 80 Z" fill="#fbbf24" stroke="#f59e0b" strokeWidth="3" />}
          {traits.head === "elk" && <path d="M57 25 C40 8 36 31 52 34 M123 25 C140 8 144 31 128 34 M54 23 L42 14 M126 23 L138 14" stroke={character.dark} strokeWidth="6" strokeLinecap="round" fill="none" />}
          {traits.head === "scorpion" && <path d="M55 29 L39 17 M125 29 L141 17" stroke={character.accent} strokeWidth="6" strokeLinecap="round" />}
          {character.id !== "shark" && character.id !== "elk" && (<><path d="M56 48 C44 31 59 18 73 29" fill={character.dark} /><path d="M124 48 C136 31 121 18 107 29" fill={character.dark} /></>)}
          <ellipse cx="86" cy="60" rx="10" ry="13" fill={character.dark} />
          <ellipse cx="114" cy="60" rx="10" ry="13" fill={character.dark} />
          <motion.circle cx="86" cy="57" r="3" fill="#f8fafc" animate={{ scaleY: [1, 0.15, 1] }} transition={{ duration: 4, repeat: Infinity, times: [0, 0.04, 0.08] }} />
          <motion.circle cx="114" cy="57" r="3" fill="#f8fafc" animate={{ scaleY: [1, 0.15, 1] }} transition={{ duration: 4, repeat: Infinity, times: [0, 0.04, 0.08] }} />
          <path d="M94 74 Q100 80 106 74" stroke={character.dark} strokeWidth="4" strokeLinecap="round" fill="none" />
          {hatItem?.equips?.includes("hat") && <path d="M65 27 C78 18 102 18 115 27 L112 35 C99 31 81 31 68 35 Z" fill={hatItem.color} stroke="#ffffff" strokeWidth="2" />}
          {(hatItem?.equips?.includes("crown") || characterLevel >= 120) && <path d="M61 23 L75 11 L90 24 L105 11 L119 23 L114 37 L66 37 Z" fill={hatItem?.color || "#fbbf24"} stroke="#fef3c7" strokeWidth="3" />}
        </svg>
        )}
      </motion.div>

      <div className="absolute inset-x-4 bottom-4 z-20">
        {!imageModeFailed && (
          <div className="mb-2 rounded-xl border border-white/10 bg-black/30 p-1.5">
            <div className="relative h-10 overflow-hidden rounded-lg">
              <CleanCharacterImage src={`/characters/${characterId}/body-max.png`} alt={`${character.name} max form`} className="absolute inset-0 h-full w-full object-contain opacity-25 grayscale" />
              <div className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${progressPercent}%` }}>
                <CleanCharacterImage src={visuals.body} alt={`${character.name} current form`} className="h-full w-full object-contain" />
              </div>
            </div>
          </div>
        )}
        <div className="mb-1 flex justify-between text-[10px] font-black uppercase tracking-wider text-white/70">
          <span>{character.rank}</span>
          <span>{progressPercent}% max</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-black/35">
          <motion.div initial={{ width: 0 }} animate={{ width: `${progressPercent}%` }} transition={{ duration: 1.2, ease: "easeOut" }} className="h-full rounded-full" style={{ background: `linear-gradient(90deg, ${character.accent}, #a7f3d0)` }} />
        </div>
      </div>
    </div>
  );
}
