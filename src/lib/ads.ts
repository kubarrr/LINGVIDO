// AdMob helper. All functions are no-ops on the web (browser / PWA) and only
// do anything inside the native Capacitor app, so the same code runs everywhere.
import { Capacitor } from "@capacitor/core";

// Real Lingvido interstitial unit (overridable via env).
const INTERSTITIAL_ID =
  process.env.NEXT_PUBLIC_ADMOB_INTERSTITIAL_ID ?? "ca-app-pub-7900523510655820/3348535874";

// Safe default: serve TEST ads. Only set NEXT_PUBLIC_ADMOB_TESTING="false"
// in production once the app is live and reviewed — clicking your own real
// ads gets your AdMob account banned.
const IS_TESTING = process.env.NEXT_PUBLIC_ADMOB_TESTING !== "false";

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
    await AdMob.prepareInterstitial({ adId: INTERSTITIAL_ID, isTesting: IS_TESTING });
    await AdMob.showInterstitial();
  } catch {
    /* ignore failures so generation still completes */
  }
}
