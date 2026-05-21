import { fileURLToPath } from 'url';

/** @type {import('next').NextConfig} */

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.API_URL ||
  'https://golo-backend-new.onrender.com';

const APP_BASE_PATH =
  process.env.NEXT_PUBLIC_APP_BASE_PATH?.trim() || '';

const FRONTEND_ROOT = fileURLToPath(new URL('.', import.meta.url));

const nextConfig = {
  basePath: APP_BASE_PATH || undefined,
  reactCompiler: true,
  turbopack: {
    root: FRONTEND_ROOT,
  },
  distDir: '.next',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
