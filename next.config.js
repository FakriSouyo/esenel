/** @type {import('next').NextConfig} */

// Supabase Storage host for product/craft images (public bucket URLs).
// Derived from env so the hostname follows the project, never hardcoded.
const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : null;

const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      ...(supabaseHost ? [{ protocol: 'https', hostname: supabaseHost }] : []),
    ],
    // Optimized images are content-hashed by (url,width,quality) — safe to
    // cache for a long time so repeat visits skip re-encoding entirely.
    minimumCacheTTL: 31536000,
  },
};

module.exports = nextConfig;
