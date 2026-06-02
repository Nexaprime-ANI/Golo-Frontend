/** @type {import('next').NextConfig} */

import { fileURLToPath } from 'url';

const TURBOPACK_ROOT = fileURLToPath(new URL('.', import.meta.url));

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.API_URL ||
  'https://golo-backend-new.onrender.com';

const APP_BASE_PATH =
  process.env.NEXT_PUBLIC_APP_BASE_PATH?.trim() || '';

const nextConfig = {
  basePath: APP_BASE_PATH || undefined,
  reactCompiler: true,
  distDir: '.next',
  turbopack: {
    root: TURBOPACK_ROOT,
  },
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
