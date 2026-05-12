"use client";

export function isAppRuntime() {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  const isLocalHost = host === "127.0.0.1" || host === "localhost";
  if (isLocalHost) return true;
  const params = new URLSearchParams(window.location.search);
  if (params.get("app") === "1") {
    try {
      window.sessionStorage.setItem("bjfit_app_runtime", "1");
    } catch {}
    return true;
  }
  try {
    if (window.sessionStorage.getItem("bjfit_app_runtime") === "1") return true;
  } catch {}
  if (window.matchMedia?.("(display-mode: standalone)")?.matches) return true;
  if (window.navigator?.standalone) return true;
  const ua = (window.navigator?.userAgent || "").toLowerCase();
  return ua.includes("wv") || ua.includes("android app") || ua.includes("iphone app");
}
