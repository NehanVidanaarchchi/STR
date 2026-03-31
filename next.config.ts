/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'odkasisncrxyskpnvqnh.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
    // For Next.js 13+ you might also need domains array
    domains: ['odkasisncrxyskpnvqnh.supabase.co'],
  },
}

module.exports = nextConfig