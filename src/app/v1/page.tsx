import { redirect } from "next/navigation";
import { isVersionEnabled } from "@/lib/router";
import Navbar from "@/components/Navbar";
import ActionPanel from "@/components/ActionPanel";
import { VersionProvider } from "@/context";

export default function V1Page() {
  // 如果 V1 版本被禁用，重定向到 V2
  if (!isVersionEnabled("v1")) {
    redirect("/v2");
  }

  return (
    <VersionProvider version="v1">
      <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950">
        <Navbar />
        <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          {/* 标题区域 */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-white mb-3">
              Token Operations
            </h1>
            <p className="text-zinc-400 max-w-md mx-auto">
              铸造或提取你的代币
            </p>
          </div>

          {/* 操作面板 */}
          <ActionPanel />
        </main>
      </div>
    </VersionProvider>
  );
}
