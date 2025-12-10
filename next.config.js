/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone', // Optimized for Amplify hosting
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  env: {
    MOCK_AWS: process.env.MOCK_AWS || 'false',
  },
  // Ensure proper handling of API routes in Amplify
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;

