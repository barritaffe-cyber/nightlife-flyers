/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: { tsconfigPath: "tsconfig.build.json" },
  outputFileTracingIncludes: {
    "/api/coco-reference-search": ["./public/samples/optimized/**/*"],
  },
  outputFileTracingExcludes: {
    "/api/coco-reference-search": [
      "./public/!(samples)/**/*",
      "./public/samples/!(optimized)/**/*",
    ],
    // This authoring endpoint returns 403 outside local development.
    "/api/flyer-css": ["./public/**/*"],
  },
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
