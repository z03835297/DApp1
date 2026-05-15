"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isVersionEnabled } from "@/lib/router";
import ConnectButton from "@/components/ConnectButton";

export default function Navbar() {
  const pathname = usePathname();

  // 判断当前激活的版本
  const isV1Active = pathname === "/v1" || pathname.startsWith("/v1/");
  const isV2Active = pathname === "/v2" || pathname.startsWith("/v2/");

  // 检查版本是否启用
  const isV1Enabled = isVersionEnabled("v1");

  return (
    <nav className="border-b border-indigo-500/20 bg-gradient-to-r from-indigo-600 to-purple-600">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and Version Navigation */}
          <div className="flex items-center gap-6">
            <Link href="/" className="text-xl font-bold text-white">
              WDB DApp
            </Link>

            {/* Version Navigation */}
            <div className="flex items-center rounded-full bg-white/10 p-1 backdrop-blur-sm">
              {isV1Enabled ? (
                <Link
                  href="/v1"
                  className={`relative rounded-full px-5 py-1.5 text-sm font-semibold transition-all duration-300 ${
                    isV1Active
                      ? "bg-white text-indigo-600 shadow-md"
                      : "text-white/80 hover:text-white hover:bg-white/10"
                  }`}
                >
                  V1
                </Link>
              ) : (
                <span
                  className="relative rounded-full px-5 py-1.5 text-sm font-semibold text-white/40 cursor-not-allowed"
                  title="V1 版本已禁用"
                >
                  V1
                </span>
              )}
              <Link
                href="/v2"
                className={`relative rounded-full px-5 py-1.5 text-sm font-semibold transition-all duration-300 ${
                  isV2Active
                    ? "bg-white text-indigo-600 shadow-md"
                    : "text-white/80 hover:text-white hover:bg-white/10"
                }`}
              >
                V2
              </Link>
            </div>
          </div>

          <div className="flex items-center">
            <ConnectButton />
          </div>
        </div>
      </div>
    </nav>
  );
}

