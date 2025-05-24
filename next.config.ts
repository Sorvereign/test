import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  experimental: {
    serverComponentsExternalPackages: ['pdf-parse'],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.module.rules.push({
        test: /\.(xlsx|xls)$/,
        use: {
          loader: 'file-loader',
          options: {
            publicPath: '/_next/static/files/',
            outputPath: 'static/files/',
          },
        },
      });
    }
    return config;
  },
};

export default nextConfig;
