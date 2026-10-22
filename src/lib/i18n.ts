import en from "../i18n/en.json";
import el from "../i18n/el.json";
import tr from "../i18n/tr.json";
import { defaultLocale, isLocale, type Locale } from "../i18n/locales";

// en.json is the reference: every key must exist there. Other locales may be
// incomplete and fall back to EN string by string.
export type UiKey = keyof typeof en;

const strings: Record<Locale, Partial<Record<UiKey, string>>> = { en, el, tr };

/**
 * Returns a translator for `lang`: `t("footer.copyright", { year: 2026 })`.
 * `t.langOf(key)` is the locale a string fell back to, or undefined when it
 * is in `lang`; use it as a `lang` attribute so fallback text is marked.
 */
export function useTranslations(lang: Locale) {
  function t(key: UiKey, params: Record<string, string | number> = {}) {
    const template = strings[lang][key] ?? strings[defaultLocale][key] ?? key;
    return template.replace(/\{(\w+)\}/g, (match, name: string) =>
      name in params ? String(params[name]) : match,
    );
  }
  t.langOf = (key: UiKey): Locale | undefined =>
    strings[lang][key] !== undefined ? undefined : defaultLocale;
  return t;
}

/** Path for `path` in `lang`, e.g. localizePath("el", "/issues/bbf") → "/el/issues/bbf/". */
export function localizePath(lang: Locale, path = "/") {
  const trimmed = path.replace(/^\/+|\/+$/g, "");
  return trimmed ? `/${lang}/${trimmed}/` : `/${lang}/`;
}

/**
 * Picks the `lang` text of a Localized value, falling back to the default
 * locale. `isFallback` lets callers show a "not yet translated" notice.
 */
export function pickLocalized(
  value: { [defaultLocale]: string } & Partial<Record<Locale, string>>,
  lang: Locale,
) {
  const text = value[lang];
  return text
    ? { text, lang, isFallback: false }
    : { text: value[defaultLocale], lang: defaultLocale as Locale, isFallback: lang !== defaultLocale };
}

/** The page locale for components: `localeOf(Astro.currentLocale)`. */
export function localeOf(value: string | undefined): Locale {
  return isLocale(value) ? value : defaultLocale;
}
