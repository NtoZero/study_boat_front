/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true, // 빌드 중 ESLint 검사 비활성화
  },
  output: "standalone",
  experimental: {
    appDir: true,
  },
};

module.exports = nextConfig;
