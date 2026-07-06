import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  output: 'standalone',
  allowedDevOrigins: [
    'learneo.local',
    'globex-fr.learneo.local',
    'acme.learneo.local',
    'beta.learneo.local',
    'suspended.learneo.local',
  ],
};

export default nextConfig;
