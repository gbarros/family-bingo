/** @type {import('next').NextConfig} */
const isP2P = process.env.NEXT_PUBLIC_GAME_MODE === 'p2p';

const nextConfig = {
  output: isP2P ? 'export' : 'standalone',
  reactStrictMode: true,
  // In P2P mode, exclude .ts files (like route.ts) so Next.js ignores API routes during static export
  pageExtensions: isP2P ? ['tsx', 'jsx', 'js'] : ['tsx', 'ts', 'jsx', 'js'],
};

module.exports = nextConfig;
