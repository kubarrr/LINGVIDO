import type { CapacitorConfig } from "@capacitor/cli";

// Lingvido is server-hosted (Next.js on Vercel). The native shell just loads
// that live URL in a WebView, so updates ship instantly without a Play update.
// AdMob runs natively on top of it.
const config: CapacitorConfig = {
  appId: "app.lingvido.twa",
  appName: "Lingvido",
  webDir: "public", // unused at runtime because server.url is set
  server: {
    // 👉 Replace with your deployed URL (Vercel / your domain)
    url: "https://lingvido.vercel.app",
    cleartext: false,
  },
};

export default config;
