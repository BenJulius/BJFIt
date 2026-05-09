"use client";
import { getCharacterShop, getFreeShopItemIds, getShopItem, MAX_CHARACTER_LEVEL } from "@/lib/characters";

const STORAGE_PREFIX = "ai-fitness-character-progress";

function storageKey(userId) {
  return `${STORAGE_PREFIX}:${userId || "guest"}`;
}

function emptyState() {
  return {
    tokens: 0,
    claimedDates: [],
    characters: {},
  };
}

export function getCharacterState(userId) {
  if (typeof window === "undefined") return emptyState();

  try {
    const parsed = JSON.parse(window.localStorage.getItem(storageKey(userId)) || "null");
    return {
      ...emptyState(),
      ...(parsed || {}),
      characters: parsed?.characters || {},
      claimedDates: parsed?.claimedDates || [],
    };
  } catch {
    return emptyState();
  }
}

export function saveCharacterState(userId, state) {
  if (typeof window === "undefined") return state;
  window.localStorage.setItem(storageKey(userId), JSON.stringify(state));
  window.dispatchEvent(new CustomEvent("character-progress-change", { detail: state }));
  return state;
}

export function initializeCharacterProgress(userId, characterId) {
  const state = getCharacterState(userId);
  const freeItems = getFreeShopItemIds(characterId);
  const current = state.characters[characterId] || { xp: 0, owned: [], equipped: [] };
  const nextCharacter = {
    ...current,
    owned: [...new Set([...freeItems, ...(current.owned || [])])],
    equipped: current.equipped?.length ? current.equipped : freeItems.slice(0, 1),
  };
  const nextState = {
    ...state,
    characters: {
      ...state.characters,
      [characterId]: nextCharacter,
    },
  };
  return saveCharacterState(userId, nextState);
}

export function getCharacterProgress(userId, characterId) {
  const state = getCharacterState(userId);
  const progress = state.characters?.[characterId] || {};
  const freeItems = getFreeShopItemIds(characterId);
  const owned = Array.isArray(progress.owned) ? [...new Set([...freeItems, ...progress.owned])] : freeItems;
  const equipped = Array.isArray(progress.equipped) && progress.equipped.length ? progress.equipped : freeItems.slice(0, 1);
  return {
    xp: Math.min(MAX_CHARACTER_LEVEL, Number(progress.xp || 0)),
    owned,
    equipped,
  };
}

function findItemForEquipped(characterId, itemId) {
  return Object.values(getCharacterShop(characterId)).flat().find((item) => item.id === itemId);
}

function mergeEquippedBySlot(characterId, existing, item) {
  const removeSlots = new Set(item.equips || []);
  const kept = existing.filter((itemId) => {
    const existingItem = findItemForEquipped(characterId, itemId);
    return !existingItem || !(existingItem.equips || []).some((slot) => removeSlots.has(slot));
  });
  return [...kept, item.id];
}

export function awardDailyCharacterProgress(userId, characterId, date = new Date()) {
  const state = getCharacterState(userId);
  const dateKey = date.toISOString().slice(0, 10);
  const alreadyClaimed = state.claimedDates.includes(dateKey);
  const current = state.characters[characterId] || { xp: 0, owned: [], equipped: [] };

  const nextState = {
    ...state,
    tokens: alreadyClaimed ? state.tokens : state.tokens + 1,
    claimedDates: alreadyClaimed ? state.claimedDates : [...state.claimedDates, dateKey],
    characters: {
      ...state.characters,
      [characterId]: {
        ...current,
        xp: Math.min(MAX_CHARACTER_LEVEL, Number(current.xp || 0) + (alreadyClaimed ? 0 : 1)),
      },
    },
  };

  saveCharacterState(userId, nextState);
  if (!alreadyClaimed && typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("character-reward-earned", {
      detail: {
        tokens: 1,
        characterXP: 1,
        characterId,
        dateKey,
      },
    }));
  }
  return { state: nextState, awarded: !alreadyClaimed };
}

export function purchaseUpgrade(userId, characterId, upgradeId) {
  const upgrade = getShopItem(characterId, upgradeId);
  if (!upgrade) return { ok: false, reason: "Upgrade not found" };

  const state = getCharacterState(userId);
  const current = state.characters[characterId] || { xp: 0, owned: [], equipped: [] };
  const owned = getCharacterProgress(userId, characterId).owned;
  const equipped = Array.isArray(current.equipped) ? current.equipped : [];

  if (owned.includes(upgradeId)) {
    const nextEquipped = mergeEquippedBySlot(characterId, equipped, upgrade);
    const nextState = {
      ...state,
      characters: {
        ...state.characters,
        [characterId]: { ...current, owned, equipped: nextEquipped },
      },
    };
    saveCharacterState(userId, nextState);
    return { ok: true, state: nextState };
  }

  if (state.tokens < upgrade.cost) return { ok: false, reason: "Not enough tokens" };

  const nextState = {
    ...state,
    tokens: state.tokens - upgrade.cost,
    characters: {
      ...state.characters,
      [characterId]: {
        ...current,
        owned: [...owned, upgradeId],
        equipped: mergeEquippedBySlot(characterId, equipped, upgrade),
      },
    },
  };
  saveCharacterState(userId, nextState);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("character-upgrade-earned", {
      detail: { upgrade, characterId },
    }));
  }
  return { ok: true, state: nextState };
}
