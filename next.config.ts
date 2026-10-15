import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: "/insight",
        destination: "/insights",
        permanent: true,
      },
      {
        source: "/insight/:slug*",
        destination: "/insights/:slug*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
