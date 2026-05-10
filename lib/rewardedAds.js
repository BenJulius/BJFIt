"use client";

export async function showRewardedAd({ onStatus } = {}) {
  const mode = process.env.NEXT_PUBLIC_ADS_MODE || "demo";
  const allowDemoReward = process.env.NEXT_PUBLIC_ALLOW_DEMO_AD_REWARD === "true";

  if (mode === "demo") {
    onStatus?.("Loading sponsored video...");
    await wait(1200);
    onStatus?.("Playing ad...");
    await wait(2200);
    if (!allowDemoReward) {
      return {
        rewarded: false,
        provider: "demo",
        reason: "Rewarded ads are not enabled in this environment yet.",
      };
    }
    onStatus?.("Reward earned.");
    return { rewarded: true, provider: "demo" };
  }

  // Future-ready hook for mobile runtime integrations (AdMob/Unity/etc).
  // Keep this hard-fail explicit so we do not silently grant rewards.
  return {
    rewarded: false,
    provider: mode,
    reason: "Ad provider not available in this environment.",
  };
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
