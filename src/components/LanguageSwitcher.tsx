"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useAppLocale } from "@/i18n/LocaleProvider";
import { locales, localeLabels } from "@/i18n/config";

export default function LanguageSwitcher() {
	const t = useTranslations("language");
	const { locale, setLocale } = useAppLocale();
	const [open, setOpen] = useState(false);
	const rootRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!open) return;
		const handleClickOutside = (event: MouseEvent) => {
			if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
				setOpen(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, [open]);

	return (
		<div ref={rootRef} className="relative">
			<button
				type="button"
				onClick={() => setOpen((v) => !v)}
				aria-label={t("label")}
				aria-expanded={open}
				className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-white/20"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					className="h-4 w-4"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					aria-hidden="true"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M12 21a9 9 0 100-18 9 9 0 000 18z"
					/>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M3.6 9h16.8M3.6 15h16.8M12 3a14.5 14.5 0 014 9 14.5 14.5 0 01-4 9 14.5 14.5 0 01-4-9 14.5 14.5 0 014-9z"
					/>
				</svg>
				<span>{localeLabels[locale]}</span>
			</button>

			{open && (
				<div className="absolute right-0 z-20 mt-2 w-36 overflow-hidden rounded-xl border border-black/5 bg-white py-1 shadow-lg">
					{locales.map((loc) => (
						<button
							key={loc}
							type="button"
							onClick={() => {
								setLocale(loc);
								setOpen(false);
							}}
							className={`block w-full px-4 py-2 text-left text-sm transition-colors ${
								loc === locale
									? "bg-indigo-50 font-semibold text-indigo-600"
									: "text-zinc-700 hover:bg-zinc-100"
							}`}
						>
							{localeLabels[loc]}
						</button>
					))}
				</div>
			)}
		</div>
	);
}
