import type { NextConfig } from 'next';

const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN;

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  output: 'standalone',
  // Dev only: tenant subdomains are created at runtime, so allow them all.
  allowedDevOrigins: baseDomain ? [baseDomain, `*.${baseDomain}`] : [],
};

export default nextConfig;
