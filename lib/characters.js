export const MAX_CHARACTER_LEVEL = 365;

export const CHARACTERS = {
  panda: {
    id: "panda",
    name: "Panda",
    accent: "#22c55e",
    fur: "#f8fafc",
    dark: "#0f172a",
    shirt: "#22c55e",
    rank: "Bamboo Bruiser",
    traits: { ears: "round", head: "round", tail: "stub", legs: "plantigrade", muzzle: "short" },
  },
  lion: {
    id: "lion",
    name: "Lion",
    accent: "#f59e0b",
    fur: "#f5c16c",
    dark: "#7c2d12",
    shirt: "#ef4444",
    rank: "Pride Lifter",
    traits: { ears: "cat", head: "mane", tail: "tuft", legs: "digitigrade", muzzle: "cat" },
  },
  shark: {
    id: "shark",
    name: "Shark",
    accent: "#06b6d4",
    fur: "#94a3b8",
    dark: "#0f172a",
    shirt: "#0ea5e9",
    rank: "Deep Set Crusher",
    traits: { ears: "fin", head: "shark", tail: "fin", legs: "sleek", muzzle: "shark" },
  },
  bear: {
    id: "bear",
    name: "Bear",
    accent: "#a16207",
    fur: "#92400e",
    dark: "#451a03",
    shirt: "#84cc16",
    rank: "Iron Den",
    traits: { ears: "round", head: "bear", tail: "stub", legs: "heavy", muzzle: "bear" },
  },
  eagle: {
    id: "eagle",
    name: "Eagle",
    accent: "#38bdf8",
    fur: "#f8fafc",
    dark: "#334155",
    shirt: "#2563eb",
    rank: "Sky Reps",
    traits: { ears: "feather", head: "beak", tail: "feathers", legs: "talon", muzzle: "beak" },
  },
  gator: {
    id: "gator",
    name: "Gator",
    accent: "#10b981",
    fur: "#15803d",
    dark: "#052e16",
    shirt: "#f97316",
    rank: "Swamp Strength",
    traits: { ears: "none", head: "gator", tail: "long", legs: "heavy", muzzle: "long" },
  },
  elk: {
    id: "elk",
    name: "Elk",
    accent: "#d97706",
    fur: "#b45309",
    dark: "#422006",
    shirt: "#14b8a6",
    rank: "Rack Puller",
    traits: { ears: "antlers", head: "elk", tail: "stub", legs: "hoof", muzzle: "long" },
  },
  scorpion: {
    id: "scorpion",
    name: "Scorpion",
    accent: "#a855f7",
    fur: "#7e22ce",
    dark: "#2e1065",
    shirt: "#ec4899",
    rank: "Sting Set",
    traits: { ears: "claws", head: "scorpion", tail: "stinger", legs: "armored", muzzle: "short" },
  },
};

export const SHOP_CATEGORIES = [
  { id: "tops", name: "Tops" },
  { id: "hats", name: "Hats" },
  { id: "gear", name: "Gear" },
  { id: "auras", name: "Auras" },
];

const BASE_SHOP = {
  panda: {
    tops: [
      { id: "panda-singlet", name: "Bamboo Singlet", cost: 0, equips: ["shirt"], color: "#22c55e" },
      { id: "panda-hoodie", name: "Forest Pump Hoodie", cost: 10, equips: ["shirt"], color: "#14532d" },
    ],
    hats: [
      { id: "panda-headband", name: "Leaf Headband", cost: 0, equips: ["hat"], color: "#86efac" },
      { id: "panda-crown", name: "Bamboo Crown", cost: 18, equips: ["crown"], color: "#fbbf24" },
    ],
    gear: [
      { id: "panda-wraps", name: "Bamboo Wraps", cost: 8, equips: ["wraps"], color: "#bbf7d0" },
    ],
    auras: [
      { id: "panda-aura", name: "Green Spirit Aura", cost: 22, equips: ["aura"], color: "#22c55e" },
    ],
  },
  lion: {
    tops: [
      { id: "lion-singlet", name: "Pride Singlet", cost: 0, equips: ["shirt"], color: "#ef4444" },
      { id: "lion-royal", name: "Royal Cutoff", cost: 14, equips: ["shirt"], color: "#7f1d1d" },
    ],
    hats: [
      { id: "lion-band", name: "Mane Band", cost: 0, equips: ["hat"], color: "#f59e0b" },
      { id: "lion-crown", name: "Pride Crown", cost: 25, equips: ["crown"], color: "#facc15" },
    ],
    gear: [
      { id: "lion-wraps", name: "Claw Wraps", cost: 11, equips: ["wraps"], color: "#fb7185" },
    ],
    auras: [
      { id: "lion-aura", name: "Roar Aura", cost: 28, equips: ["aura"], color: "#f97316" },
    ],
  },
  shark: {
    tops: [
      { id: "shark-rashguard", name: "Riptide Rashguard", cost: 0, equips: ["shirt"], color: "#0ea5e9" },
      { id: "shark-vest", name: "Abyss Vest", cost: 12, equips: ["shirt"], color: "#075985" },
    ],
    hats: [
      { id: "shark-goggles", name: "Pool Goggles", cost: 0, equips: ["hat"], color: "#67e8f9" },
      { id: "shark-fin-cap", name: "Fin Cap", cost: 16, equips: ["crown"], color: "#38bdf8" },
    ],
    gear: [
      { id: "shark-wraps", name: "Tide Wraps", cost: 10, equips: ["wraps"], color: "#22d3ee" },
    ],
    auras: [
      { id: "shark-aura", name: "Wave Aura", cost: 24, equips: ["aura"], color: "#06b6d4" },
    ],
  },
  bear: {
    tops: [
      { id: "bear-flannel", name: "Den Flannel", cost: 0, equips: ["shirt"], color: "#84cc16" },
      { id: "bear-vest", name: "Power Vest", cost: 14, equips: ["shirt"], color: "#365314" },
    ],
    hats: [
      { id: "bear-beanie", name: "Den Beanie", cost: 0, equips: ["hat"], color: "#a16207" },
      { id: "bear-cap", name: "Heavy Set Cap", cost: 15, equips: ["crown"], color: "#facc15" },
    ],
    gear: [
      { id: "bear-wraps", name: "Grizzly Wraps", cost: 12, equips: ["wraps"], color: "#d97706" },
    ],
    auras: [
      { id: "bear-aura", name: "Mountain Aura", cost: 26, equips: ["aura"], color: "#a3e635" },
    ],
  },
};

function fallbackShop(characterId) {
  const character = CHARACTERS[characterId] || CHARACTERS.panda;
  return {
    tops: [
      { id: `${characterId}-starter-top`, name: `${character.name} Training Top`, cost: 0, equips: ["shirt"], color: character.shirt },
      { id: `${characterId}-elite-top`, name: `${character.name} Elite Top`, cost: 14, equips: ["shirt"], color: character.dark },
    ],
    hats: [
      { id: `${characterId}-headband`, name: `${character.name} Headband`, cost: 0, equips: ["hat"], color: character.accent },
      { id: `${characterId}-champ-hat`, name: `${character.name} Champ Crown`, cost: 20, equips: ["crown"], color: "#fbbf24" },
    ],
    gear: [
      { id: `${characterId}-wraps`, name: `${character.name} Wraps`, cost: 10, equips: ["wraps"], color: character.accent },
    ],
    auras: [
      { id: `${characterId}-aura`, name: `${character.name} Aura`, cost: 24, equips: ["aura"], color: character.accent },
    ],
  };
}

export function getCharacter(id = "panda") {
  return CHARACTERS[id] || CHARACTERS.panda;
}

export function getCharacterShop(characterId = "panda") {
  return BASE_SHOP[characterId] || fallbackShop(characterId);
}

export function getShopItem(characterId, itemId) {
  const shop = getCharacterShop(characterId);
  return Object.values(shop).flat().find((item) => item.id === itemId);
}

export function getFreeShopItemIds(characterId = "panda") {
  return Object.values(getCharacterShop(characterId)).flat().filter((item) => item.cost === 0).map((item) => item.id);
}

export function getCharacterLevel(xp = 0) {
  const safeXP = Math.max(0, Number(xp) || 0);
  return Math.max(1, Math.min(MAX_CHARACTER_LEVEL, safeXP));
}

export function getPhysiqueStage(level = 1) {
  if (level >= 300) return 4;
  if (level >= 200) return 3;
  if (level >= 100) return 2;
  if (level >= 35) return 1;
  return 0;
}
