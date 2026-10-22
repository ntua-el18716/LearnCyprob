// Supported locales. `tr` is planned (PLAN.md §1); code must not assume a
// fixed number of locales, so derive from this list instead of hardcoding.
export const locales = ["en", "el", "tr"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale = "en" satisfies Locale;
