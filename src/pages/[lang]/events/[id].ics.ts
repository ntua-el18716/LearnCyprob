// One event as an iCalendar file, for "Add to calendar".
import type { APIRoute, GetStaticPaths } from "astro";
import { publishedLocales, type Locale } from "../../../i18n/locales";
import { localizePath } from "../../../lib/i18n";
import { getCommunityEvents, toICalendar, type CommunityEvent } from "../../../lib/community-events";

export const getStaticPaths = (async () => {
  const events = await getCommunityEvents();
  return publishedLocales.flatMap((lang) =>
    events.map((event) => ({ params: { lang, id: event.id }, props: { event } })),
  );
}) satisfies GetStaticPaths;

export const GET: APIRoute<{ event: CommunityEvent }> = ({ params, props, site }) => {
  if (!site) throw new Error("Calendar files need `site` in astro.config.mjs (absolute URLs).");
  const lang = params.lang as Locale;
  const body = toICalendar([props.event], lang, site, (e) => `${localizePath(lang, "events")}#${e.id}`);
  return new Response(body, { headers: { "Content-Type": "text/calendar; charset=utf-8" } });
};
