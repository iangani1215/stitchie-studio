import type { NextConfig } from "next";

const isGitHubPages = process.env.GITHUB_ACTIONS === "true";

const nextConfig: NextConfig = {
  output: isGitHubPages ? "export" : undefined,
  basePath: isGitHubPages ? "/stitchie-studio" : undefined,
  assetPrefix: isGitHubPages ? "/stitchie-studio/" : undefined,
  images: {
    unoptimized: true,
  },
  typescript: {
    // The Cloudflare-only database shim is not part of the static Pages build.
    ignoreBuildErrors: isGitHubPages,
  },
};

export default nextConfig;
