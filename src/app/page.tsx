import { redirect } from "next/navigation";
import { getDefaultVersionPath } from "@/lib/router";

export default function Home() {
  // 根据路由配置重定向到默认版本
  redirect(getDefaultVersionPath());
}
