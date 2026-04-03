/** @type {import('next').NextConfig} */
const isMobileBuild = process.env.NEXT_PUBLIC_MOBILE_BUILD === 'true'

const nextConfig = {
  reactStrictMode: true,
  // Static export for Capacitor native app builds
  ...(isMobileBuild ? { output: 'export', distDir: 'out' } : {}),
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || ' ',
  },
  images: {
    // Required for static export (Capacitor)
    unoptimized: isMobileBuild,
  },
}

module.exports = nextConfig
