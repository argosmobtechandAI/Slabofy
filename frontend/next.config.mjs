/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // Disable ESLint during build for testing speed
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Ignore TypeScript errors during build (if any files are TS)
    ignoreBuildErrors: true,
  }
};

export default nextConfig;
