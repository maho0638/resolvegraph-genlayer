/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/api/reviewer/case",
          destination: "/api/reviewer/case-live",
        },
        {
          source: "/api/evidence",
          destination: "/api/evidence-live",
        },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;
