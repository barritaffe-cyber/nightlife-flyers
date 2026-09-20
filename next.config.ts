import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: { tsconfigPath: "tsconfig.build.json" },
  allowedDevOrigins: ["192.168.1.152"],
};

export default nextConfig;
