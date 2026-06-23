/** @type {import('next').NextConfig} */
const nextConfig = {
  // ── Packages that must NEVER be bundled into the client ──────────────────
  // These packages use Node.js APIs (fs, crypto, net) and will break if
  // webpack tries to bundle them for the browser.
  serverExternalPackages: ['@google/genai', 'bcryptjs', 'jsonwebtoken', 'nodemailer', 'pg'],

  // ── Hardened production settings ─────────────────────────────────────────
  poweredByHeader: false, // Remove X-Powered-By: Next.js (reduces fingerprinting)

  // ── Image domains ─────────────────────────────────────────────────────────
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'i.pravatar.cc' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
    ],
  },

  // ── Experimental ─────────────────────────────────────────────────────────
  experimental: {
    // Opt into the Next.js 15 Partial Prerendering for better performance
    // ppr: true,
  },
};

export default nextConfig;
