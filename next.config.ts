import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === 'production';
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || (isProd ? '/Personal_Portfolio' : '');

const nextConfig: NextConfig = {
  output: 'export',
  basePath: basePath,
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
