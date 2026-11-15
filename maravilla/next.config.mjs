/** @type {import('next').NextConfig} */
const nextConfig = {
  // La landing è una pagina statica in public/landing (kit tasteskill); "/" la serve senza cambiare URL.
  async rewrites() {
    return {
      beforeFiles: [
        { source: "/", destination: "/landing/index.html" },
        { source: "/assets/:path*", destination: "/landing/assets/:path*" },
        { source: "/favicon.svg", destination: "/landing/favicon.svg" },
      ],
    };
  },
};
export default nextConfig;
