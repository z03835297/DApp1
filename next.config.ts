import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	// Externalize pino and thread-stream to avoid bundling Node.js native modules
	serverExternalPackages: ["pino", "pino-pretty", "thread-stream"],

	// Explicitly use Turbopack (Next.js 16 default)
	turbopack: {},
};

export default nextConfig;
