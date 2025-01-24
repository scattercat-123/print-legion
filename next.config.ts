import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    serverActions: {
      bodySizeLimit: '5mb',

    },
    reactCompiler: true,
    cpus: 8,
  }
};

export default nextConfig;
