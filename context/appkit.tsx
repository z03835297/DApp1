"use client";

import { createAppKit } from "@reown/appkit/react";
import { EthersAdapter } from "@reown/appkit-adapter-ethers";
import { mainnet, sepolia } from "@reown/appkit/networks";
import type { ReactNode } from "react";

// 1. Get projectId at https://dashboard.reown.com
const projectId = process.env.NEXT_PUBLIC_PROJECT_ID || "";

// 2. Create a metadata object
const metadata = {
  name: "WDB888 DApp",
  description: "WDB888 DApp",
  url: typeof window !== "undefined" ? window.location.origin : "https://localhost:3000",
  icons: ["/favicon.ico"],
};

// 3. Create the AppKit instance
createAppKit({
  adapters: [new EthersAdapter()],
  metadata,
  networks: [mainnet, sepolia],
  projectId,
  features: {
    analytics: true,
  },
});

// 4. Export the provider component
export function AppKitProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}