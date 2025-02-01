import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    serverActions: {
      bodySizeLimit: '5mb',

    },
    reactCompiler: true,
    cpus: 8,
  
  },
  devIndicators:{appIsrStatus:false}
};

export default nextConfig;
