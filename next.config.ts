import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins: ["192.168.1.38"],
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;
