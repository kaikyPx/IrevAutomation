import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configuração ROOT solicitada no erro do console
  // @ts-ignore - Esta chave é necessária para funcionar via ngrok no Next.js 16 dev mode
  allowedDevOrigins: [
    'c9f5-2804-14d-789d-47b3-ed3d-fa2e-2023-485b.ngrok-free.app',
    '121b-2804-14d-789d-47b3-ed3d-fa2e-2023-485b.ngrok-free.app'
  ],

  // Configuração para resolver o erro de WebSocket (HMR) ao usar ngrok e SQLite Nativo
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push('better-sqlite3');
    }
    if (!isServer) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      };
    }
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.ngrok-free.app',
      },
    ],
  },
};

export default nextConfig;
