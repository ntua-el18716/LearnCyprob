// Supported locales. `tr` is planned (PLAN.md §1); code must not assume a
// fixed number of locales, so derive from this list instead of hardcoding.
export const locales = ["en", "el", "tr"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale = "en" satisfies Locale;

// Locales that get routes. A locale can exist (content, strings) before it is
// published.
export const publishedLocales = ["en", "el"] as const satisfies readonly Locale[];

export const localeMeta: Record<Locale, { name: string; short: string; ogLocale: string }> = {
  en: { name: "English", short: "EN", ogLocale: "en_US" },
  el: { name: "Ελληνικά", short: "ΕΛ", ogLocale: "el_GR" },
  tr: { name: "Türkçe", short: "TR", ogLocale: "tr_TR" },
};

export function isLocale(value: string | undefined): value is Locale {
  return (locales as readonly string[]).includes(value ?? "");
}
