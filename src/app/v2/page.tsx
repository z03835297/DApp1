"use client";
import Navbar from "@/components/Navbar";
import ActionPanel from "@/components/ActionPanel";
import { VersionProvider } from "@/context";

export default function V2Page() {
  return (
    <VersionProvider version="v2">
      <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950">
        <Navbar />
        <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          {/* 标题区域 */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-white mb-3">
              Token Operations V2
            </h1>
            <p className="text-zinc-400 max-w-md mx-auto">
              免 gas 转账
            </p>
          </div>

          {/* 操作面板 */}
          <ActionPanel />
        </main>
      </div>
    </VersionProvider>
  );
}
