/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    appDir: true,
  },
  images: {
    domains: ['localhost'],
  },
  env: {
    NEXT_PUBLIC_LEADERBOARD_API_URL: process.env.NEXT_PUBLIC_LEADERBOARD_API_URL || 'http://localhost:8080',
    NEXT_PUBLIC_AGENT_BUILDER_URL: process.env.NEXT_PUBLIC_AGENT_BUILDER_URL || 'http://localhost:5601',
  },
}

module.exports = nextConfig
