import test from "node:test";
import assert from "node:assert/strict";
import {
  buildHandleSuggestions,
  getStepProgress,
  isPremiumPlan,
  normalizeHandle,
  validateOnboardingStep,
} from "../lib/onboarding.js";

test("normalizeHandle keeps handles short, lowercase, and app-safe", () => {
  assert.equal(normalizeHandle("BJ Fit!!_Champion_123456789"), "bjfit_champion_12345");
  assert.equal(normalizeHandle("UPPER name"), "uppername");
});

test("buildHandleSuggestions creates deterministic unique suggestions", () => {
  assert.deepEqual(buildHandleSuggestions("Julius BJ", 42), ["juliusbj", "juliusbj42", "julius_lifts"]);
  assert.deepEqual(buildHandleSuggestions("", 9), ["athlete", "athlete9", "athlete_lifts"]);
});

test("getStepProgress clamps progress within the onboarding range", () => {
  assert.equal(getStepProgress(1, 7), 14);
  assert.equal(getStepProgress(7, 7), 100);
  assert.equal(getStepProgress(99, 7), 100);
});

test("premium plan detection only treats paid trial options as premium", () => {
  assert.equal(isPremiumPlan("yearly"), true);
  assert.equal(isPremiumPlan("monthly"), true);
  assert.equal(isPremiumPlan("free"), false);
});

test("validateOnboardingStep gates required calibration and premium terms", () => {
  assert.match(validateOnboardingStep(2, {}), /goal/i);
  assert.match(validateOnboardingStep(3, { goal: "build_muscle" }), /training level/i);
  assert.match(validateOnboardingStep(4, { goal: "build_muscle", experienceLevel: "beginner" }), /days/i);
  assert.match(validateOnboardingStep(5, { goal: "build_muscle", experienceLevel: "beginner", trainingDays: "3" }), /age/i);
  assert.match(validateOnboardingStep(5, { age: "30", goal: "build_muscle", experienceLevel: "beginner", trainingDays: "3" }), /weight/i);
  assert.match(validateOnboardingStep(7, { planChoice: "yearly" }, { acceptTrialTerms: false }), /trial/i);
  assert.equal(validateOnboardingStep(7, { planChoice: "free" }, { acceptTrialTerms: false }), "");
  assert.match(validateOnboardingStep(9, { username: "bj" }), /handle/i);
});
