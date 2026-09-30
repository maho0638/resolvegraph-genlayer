/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/api/reviewer/case",
          destination: "/api/reviewer/case-live",
        },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;
