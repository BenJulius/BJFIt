"use client";
import { getCharacter } from "@/lib/characters";
import { useState } from "react";
import { getCharacterVisuals } from "@/lib/characterVisuals";
import CleanCharacterImage from "@/components/CleanCharacterImage";

export default function CharacterPortrait({ characterId = "panda", size = 72, className = "", level = 1 }) {
  const character = getCharacter(characterId);
  const traits = character.traits || {};
  const visuals = getCharacterVisuals(characterId, level);
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <div
      className={`character-stage relative overflow-hidden rounded-2xl bg-slate-950 ${className}`}
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle at 50% 36%, ${character.accent}30, transparent 44%), linear-gradient(145deg, ${character.dark}66, #020617 70%)`,
        boxShadow: "inset 0 -18px 34px rgba(0,0,0,0.42)",
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-black/20" />
      {!imgFailed && (
        <CleanCharacterImage
          src={visuals.portrait}
          alt={`${character.name} portrait`}
          className="absolute inset-0 h-full w-full object-cover [image-rendering:auto]"
          onError={() => setImgFailed(true)}
        />
      )}
      {imgFailed && (
      <svg viewBox="0 0 120 120" className="h-full w-full">
        <ellipse cx="60" cy="112" rx="28" ry="12" fill="#00000055" />
        <path d="M35 112 C32 86 40 72 50 72 C60 72 66 88 64 112 Z" fill="#f5c9a5" />
        <path d="M56 112 C54 86 62 72 72 72 C82 72 88 88 85 112 Z" fill="#e6b087" />
        <path d="M40 71 C40 48 49 36 60 36 C71 36 80 48 80 71 Z" fill="#f3c7a7" />
        <path d="M43 72 C49 68 71 68 77 72" stroke="#c48b64" strokeWidth="2" strokeLinecap="round" />
        <path d="M50 86 L70 86 M52 94 L68 94 M60 79 L60 102" stroke="#b77d59" strokeWidth="2.5" strokeLinecap="round" opacity="0.7" />

        <circle cx="60" cy="30" r="22" fill={character.fur} />
        {traits.head === "mane" && <circle cx="60" cy="30" r="28" fill={character.dark} opacity="0.85" />}
        {traits.head === "mane" && <circle cx="60" cy="30" r="20" fill={character.fur} />}
        {traits.head === "shark" && <path d="M60 2 L72 16 L48 16 Z" fill={character.fur} />}
        {traits.head === "gator" && <path d="M42 33 C49 21 73 21 83 33 C72 41 52 41 42 33 Z" fill={character.fur} stroke={character.dark} strokeWidth="2" />}
        {traits.head === "beak" && <path d="M58 37 L78 42 L59 47 Z" fill="#fbbf24" stroke="#f59e0b" strokeWidth="2" />}
        {traits.head === "elk" && <path d="M42 16 C31 5 31 24 41 24 M78 16 C89 5 89 24 79 24" stroke={character.dark} strokeWidth="4" strokeLinecap="round" fill="none" />}
        {traits.head === "scorpion" && <path d="M44 15 L34 9 M76 15 L86 9" stroke={character.accent} strokeWidth="4" strokeLinecap="round" />}
        {traits.ears !== "none" && traits.head !== "shark" && traits.head !== "beak" && traits.head !== "gator" && (
          <>
            <path d="M40 24 C33 14 42 8 49 15" fill={character.dark} />
            <path d="M80 24 C87 14 78 8 71 15" fill={character.dark} />
          </>
        )}
        <ellipse cx="51" cy="31" rx="6" ry="8" fill={character.dark} />
        <ellipse cx="69" cy="31" rx="6" ry="8" fill={character.dark} />
        <circle cx="51" cy="28" r="2.4" fill="#f8fafc" />
        <circle cx="69" cy="28" r="2.4" fill="#f8fafc" />
        <path d="M56 42 Q60 46 64 42" stroke={character.dark} strokeWidth="3" strokeLinecap="round" fill="none" />
      </svg>
      )}
    </div>
  );
}
