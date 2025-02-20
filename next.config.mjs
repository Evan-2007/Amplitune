/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    output: "export",
    images: {
      unoptimized: true
    },
    webpack: (config) => {
      config.module.rules.push({
        test: /\.svg$/,
        use: ["@svgr/webpack"],
      });
      return config;
    }
};

export default nextConfig;
