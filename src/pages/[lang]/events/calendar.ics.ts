// Every listed event as one iCalendar file, to import or subscribe to.
import type { APIRoute, GetStaticPaths } from "astro";
import { publishedLocales, type Locale } from "../../../i18n/locales";
import { localizePath, useTranslations } from "../../../lib/i18n";
import { getCommunityEvents, toICalendar } from "../../../lib/community-events";

export const getStaticPaths = (() =>
  publishedLocales.map((lang) => ({ params: { lang } }))) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ params, site }) => {
  if (!site) throw new Error("Calendar files need `site` in astro.config.mjs (absolute URLs).");
  const lang = params.lang as Locale;
  const t = useTranslations(lang);
  const body = toICalendar(
    await getCommunityEvents(),
    lang,
    site,
    (e) => `${localizePath(lang, "events")}#${e.id}`,
    `${t("site.title")}: ${t("communityEvents.title")}`,
  );
  return new Response(body, { headers: { "Content-Type": "text/calendar; charset=utf-8" } });
};
