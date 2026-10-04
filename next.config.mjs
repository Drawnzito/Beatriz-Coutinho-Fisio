/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["@react-pdf/renderer", "yoga-layout"],
    outputFileTracingIncludes: {
      "/dashboard/evolucao/**": ["./node_modules/pdfkit/js/**/*"],
    },
  },
};

export default nextConfig;
