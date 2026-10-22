import { getCollection } from "astro:content";
import { defaultLocale, type Locale } from "../i18n/locales";
import { isVisible } from "./drafts";

const langOf = (id: string) => id.split("/")[0] as Locale;

/** Every visible site-page slug (about, methodology, …). */
export async function getPageSlugs() {
  const pages = await getCollection("pages", isVisible);
  return [...new Set(pages.map((p) => p.data.slug))].sort();
}

/** The page in `lang`, else the default locale; `isFallback` when not in `lang`. */
export async function getPage(slug: string, lang: Locale) {
  const versions = await getCollection("pages", (p) => p.data.slug === slug && isVisible(p));
  const entry =
    versions.find((p) => langOf(p.id) === lang) ??
    versions.find((p) => langOf(p.id) === defaultLocale) ??
    versions[0];
  if (!entry) return undefined;
  const entryLang = langOf(entry.id);
  return { entry, lang: entryLang, isFallback: entryLang !== lang };
}
