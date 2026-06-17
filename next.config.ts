import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow the phone / other LAN devices to load dev resources (HMR, chunks)
  allowedDevOrigins: ["192.168.1.248", "10.67.7.13"],
};

export default nextConfig;
