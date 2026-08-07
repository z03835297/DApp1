import { redirect } from "next/navigation";

/** 旧 /v3 入口保留，统一落到主页，避免外链失效 */
export default function V3Page() {
	redirect("/");
}
