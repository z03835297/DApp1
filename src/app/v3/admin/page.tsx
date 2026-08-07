import { redirect } from "next/navigation";

/** 旧 /v3/admin 入口保留，统一落到 /admin */
export default function V3AdminPage() {
	redirect("/admin");
}
