/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  serverExternalPackages: ['@prisma/client', 'prisma']
};

module.exports = nextConfig;