/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  eslint: {
    ignoreDuringBuilds: true,
  },
   experimental: {
    serverComponentsExternalPackages: ['@prisma/client']
  },
  typescript: {
    // same for TS errors: allow production builds to succeed
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;
