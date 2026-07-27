"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isVersionEnabled } from "@/lib/router";
import ConnectButton from "@/components/ConnectButton";
import { useIsV3Admin } from "@/hooks";

export default function Navbar() {
	const pathname = usePathname();

	const isV1Active = pathname === "/v1" || pathname.startsWith("/v1/");
	const isV2Active = pathname === "/v2" || pathname.startsWith("/v2/");
	const isV3Active =
		(pathname === "/v3" || pathname.startsWith("/v3/")) &&
		!pathname.startsWith("/v3/admin");
	const isAdminActive = pathname.startsWith("/v3/admin");

	const isV1Enabled = isVersionEnabled("v1");
	const { isAdmin } = useIsV3Admin();

	const tabClass = (active: boolean) =>
		`relative rounded-full px-5 py-1.5 text-sm font-semibold transition-all duration-300 ${
			active
				? "bg-white text-indigo-600 shadow-md"
				: "text-white/80 hover:text-white hover:bg-white/10"
		}`;

	return (
		<nav className="border-b border-indigo-500/20 bg-gradient-to-r from-indigo-600 to-purple-600">
			<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				<div className="flex h-16 items-center justify-between">
					<div className="flex items-center gap-6">
						<Link href="/" className="text-xl font-bold text-white">
							BaCi DApp
						</Link>

						<div className="flex items-center rounded-full bg-white/10 p-1 backdrop-blur-sm">
							{isV1Enabled ? (
								<Link href="/v1" className={tabClass(isV1Active)}>
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
							<Link href="/v2" className={tabClass(isV2Active)}>
								V2
							</Link>
							<Link href="/v3" className={tabClass(isV3Active)}>
								V3
							</Link>
							{isAdmin && (
								<Link href="/v3/admin" className={tabClass(isAdminActive)}>
									Admin
								</Link>
							)}
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
