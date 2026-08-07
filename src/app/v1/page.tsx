"use client";

import { redirect } from "next/navigation";
import { useTranslations } from "next-intl";
import { isVersionEnabled } from "@/lib/router";
import Navbar from "@/components/Navbar";
import ActionPanel from "@/components/ActionPanel";
import { VersionProvider } from "@/context";

export default function V1Page() {
  const t = useTranslations("v1Page");

  // 如果 V1 版本被禁用，重定向到主页
  if (!isVersionEnabled("v1")) {
    redirect("/");
  }

  return (
    <VersionProvider version="v1">
      <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950">
        <Navbar />
        <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          {/* 标题区域 */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-white mb-3">
              {t("title")}
            </h1>
            <p className="text-zinc-400 max-w-md mx-auto">
              {t("subtitle")}
            </p>
          </div>

          {/* 操作面板 */}
          <ActionPanel />
        </main>
      </div>
    </VersionProvider>
  );
}
