/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  allowedDevOrigins: ['192.168.1.12'],
  images: {
    // Médias envoyés dans DatoCMS
    remotePatterns: [{ protocol: 'https', hostname: 'www.datocms-assets.com' }],
  },
};

export default nextConfig;
