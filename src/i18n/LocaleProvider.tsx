"use client";

import { NextIntlClientProvider } from "next-intl";
import {
	createContext,
	useContext,
	useEffect,
	useMemo,
	useSyncExternalStore,
	type ReactNode,
} from "react";
import {
	LOCALE_STORAGE_KEY,
	defaultLocale,
	isAppLocale,
	type AppLocale,
} from "./config";
import en from "./messages/en.json";
import zhCN from "./messages/zh-CN.json";
import zhTW from "./messages/zh-TW.json";

const messagesByLocale: Record<AppLocale, typeof en> = {
	en,
	"zh-CN": zhCN,
	"zh-TW": zhTW,
};

interface LocaleContextValue {
	locale: AppLocale;
	setLocale: (locale: AppLocale) => void;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

const localeListeners = new Set<() => void>();

function subscribeLocale(callback: () => void) {
	localeListeners.add(callback);
	window.addEventListener("storage", callback);
	return () => {
		localeListeners.delete(callback);
		window.removeEventListener("storage", callback);
	};
}

function getStoredLocale(): AppLocale {
	const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
	return isAppLocale(stored) ? stored : defaultLocale;
}

function getServerLocale(): AppLocale {
	return defaultLocale;
}

function setStoredLocale(next: AppLocale) {
	window.localStorage.setItem(LOCALE_STORAGE_KEY, next);
	for (const listener of localeListeners) {
		listener();
	}
}

/**
 * 语言 Provider：不使用 URL 前缀路由，语言偏好持久化在 localStorage。
 * 首次渲染统一使用 defaultLocale（避免 SSR/CSR 不一致），客户端通过 useSyncExternalStore 读取 localStorage。
 */
export function LocaleProvider({ children }: { children: ReactNode }) {
	const locale = useSyncExternalStore(
		subscribeLocale,
		getStoredLocale,
		getServerLocale,
	);

	useEffect(() => {
		document.documentElement.lang = locale;
	}, [locale]);

	const value = useMemo(
		() => ({ locale, setLocale: setStoredLocale }),
		[locale],
	);

	return (
		<LocaleContext.Provider value={value}>
			<NextIntlClientProvider
				locale={locale}
				messages={messagesByLocale[locale]}
				timeZone="UTC"
			>
				{children}
			</NextIntlClientProvider>
		</LocaleContext.Provider>
	);
}

export function useAppLocale(): LocaleContextValue {
	const ctx = useContext(LocaleContext);
	if (!ctx) {
		throw new Error("useAppLocale must be used within LocaleProvider");
	}
	return ctx;
}
