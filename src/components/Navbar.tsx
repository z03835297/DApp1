"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import ConnectButton from "@/components/ConnectButton";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useIsV3Admin } from "@/hooks";

export default function Navbar() {
	const pathname = usePathname();
	const t = useTranslations("nav");
	const tCommon = useTranslations("common");

	const isHomeActive = pathname === "/";
	const isAdminActive = pathname === "/admin" || pathname.startsWith("/admin/");

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
						<Link
							href="/"
							className="flex items-center gap-2 text-xl font-bold text-white"
						>
							<Image
								src="/BaCi_token_64x64.png"
								alt={tCommon("appName")}
								width={32}
								height={32}
								className="rounded-full"
								priority
							/>
							{tCommon("appName")}
						</Link>

						{isAdmin && (
							<div className="flex items-center rounded-full bg-white/10 p-1 backdrop-blur-sm">
								<Link href="/" className={tabClass(isHomeActive)}>
									{t("home")}
								</Link>
								<Link href="/admin" className={tabClass(isAdminActive)}>
									{t("admin")}
								</Link>
							</div>
						)}
					</div>

					<div className="flex items-center gap-3">
						<LanguageSwitcher />
						<ConnectButton />
					</div>
				</div>
			</div>
		</nav>
	);
}
