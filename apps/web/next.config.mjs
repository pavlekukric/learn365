/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@learn365/ui', '@learn365/core', '@learn365/content'],
  typedRoutes: true,
  webpack(config) {
    // Workspace packages author imports with explicit ".js" extensions
    // (TS `moduleResolution: Bundler` style). Teach webpack to resolve
    // those back to their .ts / .tsx source files so transpilePackages works.
    config.resolve = config.resolve ?? {};
    config.resolve.extensionAlias = {
      ...(config.resolve.extensionAlias ?? {}),
      '.js': ['.ts', '.tsx', '.js'],
      '.mjs': ['.mts', '.mjs'],
    };
    return config;
  },
};

export default nextConfig;
