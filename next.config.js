/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'cdn.prod.website-files.com',
      'i.ytimg.com',
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.prod.website-files.com',
      },
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
      },
    ],
  },
  // Performance optimizations
  compiler: {
    // Keep console logs for debugging (remove in final production if needed)
    removeConsole: false,
  },
  // Optimize CSS
  experimental: {
    optimizeCss: true,
  },
  // Enable SWC minification
  swcMinify: true,
  // Optimize fonts
  optimizeFonts: true,
}

module.exports = nextConfig

