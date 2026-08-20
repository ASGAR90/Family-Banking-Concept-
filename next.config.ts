import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@electric-sql/pglite", "pg"],
  allowedDevOrigins: ["*"],
};

export default nextConfig;
