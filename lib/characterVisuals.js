import { getCharacterLevel } from "@/lib/characters";

function stageFromLevel(level) {
  if (level >= 300) return "max";
  if (level >= 200) return "elite";
  if (level >= 100) return "advanced";
  if (level >= 35) return "trained";
  return "base";
}

export function getCharacterVisuals(characterId = "panda", level = 1) {
  const stage = stageFromLevel(getCharacterLevel(level));
  return {
    portrait: `/characters/${characterId}/portrait.png`,
    body: `/characters/${characterId}/body-${stage}.png`,
    stage,
  };
}

