/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@claudio/shared', '@claudio/ui'],
  typedRoutes: true,
}

export default nextConfig
