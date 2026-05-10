import assert from "node:assert/strict";
import {
  buildLocalPremiumAnalysis,
  isPremiumProfile,
  normalizePremiumAnalysis,
} from "../lib/insights.js";

function test(name, fn) {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    throw error;
  }
}

test("isPremiumProfile only treats premium tier as premium", () => {
  assert.equal(isPremiumProfile({ tier: "premium" }), true);
  assert.equal(isPremiumProfile({ tier: "Premium" }), true);
  assert.equal(isPremiumProfile({ tier: "free" }), false);
  assert.equal(isPremiumProfile({}), false);
});

test("normalizePremiumAnalysis fills missing Gemini fields from fallback", () => {
  const fallback = buildLocalPremiumAnalysis(
    [{ exercise: "Bench Press", weight: 185, reps: 5 }],
    { goal: "build_muscle" },
    { totalSets: 1, totalVolume: 925 }
  );

  const normalized = normalizePremiumAnalysis({ summary: "  Push bench volume. ", priorities: ["Keep reps crisp"] }, fallback);

  assert.equal(normalized.summary, "Push bench volume.");
  assert.deepEqual(normalized.priorities, ["Keep reps crisp"]);
  assert.deepEqual(normalized.risks, fallback.risks);
  assert.equal(normalized.nextCheckIn, fallback.nextCheckIn);
});
