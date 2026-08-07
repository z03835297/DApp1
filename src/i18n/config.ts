/**
 * 支持的语言列表与相关配置。
 * 不使用 URL 前缀路由，语言选择持久化在 localStorage 中。
 */
export const locales = ["en", "zh-CN", "zh-TW"] as const;

export type AppLocale = (typeof locales)[number];

export const defaultLocale: AppLocale = "en";

export const localeLabels: Record<AppLocale, string> = {
	en: "English",
	"zh-CN": "简体中文",
	"zh-TW": "繁體中文",
};

/** next-intl / RainbowKit 都需要 -> RainbowKit 支持的 locale 代码 */
export const rainbowKitLocaleMap: Record<AppLocale, string> = {
	en: "en-US",
	"zh-CN": "zh-CN",
	"zh-TW": "zh-TW",
};

export const LOCALE_STORAGE_KEY = "app-locale";

export function isAppLocale(value: string | null | undefined): value is AppLocale {
	return !!value && (locales as readonly string[]).includes(value);
}
