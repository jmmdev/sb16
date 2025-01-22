/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "images.start.gg",
            }
        ],    
    },
};

export default nextConfig;