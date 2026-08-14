/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
    // Optimized images are content-hashed by (url,width,quality) — safe to
    // cache for a long time so repeat visits skip re-encoding entirely.
    minimumCacheTTL: 31536000,
  },
};

module.exports = nextConfig;
