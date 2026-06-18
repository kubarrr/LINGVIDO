// AdMob helper. All functions are no-ops on the web (browser / PWA) and only
// do anything inside the native Capacitor app, so the same code runs everywhere.
import { Capacitor } from "@capacitor/core";

// Google's official TEST interstitial id. Replace via env with your real unit
// id for production: NEXT_PUBLIC_ADMOB_INTERSTITIAL_ID
const INTERSTITIAL_ID =
  process.env.NEXT_PUBLIC_ADMOB_INTERSTITIAL_ID ?? "ca-app-pub-3940256099942544/1033173712";

function isNative() {
  return Capacitor.getPlatform() !== "web";
}

let initialized = false;

export async function initAds() {
  if (!isNative() || initialized) return;
  try {
    const { AdMob } = await import("@capacitor-community/admob");
    await AdMob.initialize();
    initialized = true;
  } catch {
    /* ignore — ads are non-critical */
  }
}

/**
 * Shows a full-screen interstitial (e.g. while a lesson generates).
 * Resolves when the ad is dismissed; no-op and instant on web.
 */
export async function showInterstitial() {
  if (!isNative()) return;
  try {
    const { AdMob } = await import("@capacitor-community/admob");
    await AdMob.prepareInterstitial({ adId: INTERSTITIAL_ID });
    await AdMob.showInterstitial();
  } catch {
    /* ignore failures so generation still completes */
  }
}
