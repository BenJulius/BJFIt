"use client";

export function isAppRuntime() {
  if (typeof window === "undefined") return false;
  const params = new URLSearchParams(window.location.search);
  if (params.get("app") === "1") return true;
  if (window.matchMedia?.("(display-mode: standalone)")?.matches) return true;
  if (window.navigator?.standalone) return true;
  const ua = (window.navigator?.userAgent || "").toLowerCase();
  return ua.includes("wv") || ua.includes("android app") || ua.includes("iphone app");
}

