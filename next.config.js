/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: { tsconfigPath: "tsconfig.build.json" },
  allowedDevOrigins: ["192.168.1.152"],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...(config.resolve.fallback || {}),
        fs: false,
        path: false,
        os: false,
      };
    }
    return config;
  },
};
module.exports = nextConfig;
