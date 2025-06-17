/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['172.16.1.160'],
  experimental: {
    serverActions: {
      allowedOrigins: ['172.16.1.160']
    }
  }
}

export default nextConfig 