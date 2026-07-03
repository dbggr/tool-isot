const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  // App Router is stable in Next.js 15+, no longer experimental
  
  // Performance optimizations
  experimental: {
    // Enable optimized package imports for better tree shaking
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },

  // Note: The former custom `webpack` config (null-loader for a now-removed
  // `tactical-command` dir + manual splitChunks) was dropped in the Next 16
  // upgrade. Next 16 defaults to Turbopack, which handles chunking/tree-shaking
  // automatically and rejects a `webpack` key. The excluded dir no longer exists.

  // Compiler optimizations
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  },

  // Headers for better caching
  async headers() {
    return [
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=300, s-maxage=300', // 5 minutes
          },
        ],
      },
    ]
  },
}

module.exports = withBundleAnalyzer(nextConfig)