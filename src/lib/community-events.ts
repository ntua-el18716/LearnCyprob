import { getCollection, type CollectionEntry } from "astro:content";
import { isVisible } from "./drafts";
import { pickLocalized } from "./i18n";
import type { Locale } from "../i18n/locales";

export type CommunityEvent = CollectionEntry<"communityEvents">;

/** Visible community events, soonest first. */
export async function getCommunityEvents() {
  return (await getCollection("communityEvents", isVisible)).sort(
    (a, b) =>
      a.data.date.valueOf() - b.data.date.valueOf() ||
      (a.data.startTime ?? "").localeCompare(b.data.startTime ?? "") ||
      a.id.localeCompare(b.id),
  );
}

export const isoDay = (d: Date) => d.toISOString().slice(0, 10);

/** The event's last day as YYYY-MM-DD; it counts as upcoming until that day ends. */
export const lastDay = (e: CommunityEvent) => isoDay(e.data.endDate ?? e.data.date);

/**
 * Splits events into upcoming (soonest first) and past (latest first) as of
 * `today` (YYYY-MM-DD). The page re-checks in the browser, since a static
 * build goes stale.
 */
export function splitByDate(events: CommunityEvent[], today: string) {
  return {
    upcoming: events.filter((e) => lastDay(e) >= today),
    past: events.filter((e) => lastDay(e) < today).reverse(),
  };
}

/** Today in Cyprus, as YYYY-MM-DD. */
export const todayInCyprus = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Nicosia" }).format(new Date());

// ---------------------------------------------------------------------------
// iCalendar (RFC 5545)
// ---------------------------------------------------------------------------

// Cyprus time (EET/EEST, EU summer-time rules), so calendar apps place
// events correctly wherever the reader is.
const vtimezone = [
  "BEGIN:VTIMEZONE",
  "TZID:Europe/Nicosia",
  "BEGIN:STANDARD",
  "DTSTART:19701025T040000",
  "TZOFFSETFROM:+0300",
  "TZOFFSETTO:+0200",
  "TZNAME:EET",
  "RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU",
  "END:STANDARD",
  "BEGIN:DAYLIGHT",
  "DTSTART:19700329T030000",
  "TZOFFSETFROM:+0200",
  "TZOFFSETTO:+0300",
  "TZNAME:EEST",
  "RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU",
  "END:DAYLIGHT",
  "END:VTIMEZONE",
];

const escapeText = (s: string) =>
  s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

// Lines are folded at 75 octets; continuation lines start with a space.
function fold(line: string) {
  const bytes = new TextEncoder().encode(line);
  if (bytes.length <= 75) return line;
  const out: string[] = [];
  let current = "";
  let size = 0;
  for (const char of line) {
    const n = new TextEncoder().encode(char).length;
    if (size + n > (out.length === 0 ? 75 : 74)) {
      out.push(current);
      current = "";
      size = 0;
    }
    current += char;
    size += n;
  }
  out.push(current);
  return out.join("\r\n ");
}

const compactDay = (d: Date) => isoDay(d).replace(/-/g, "");
const nextDay = (d: Date) => new Date(d.valueOf() + 86_400_000);

function vevent(e: CommunityEvent, lang: Locale, site: URL, pageUrl: string) {
  const { data } = e;
  const text = (v: Parameters<typeof pickLocalized>[0]) => pickLocalized(v, lang).text;
  const last = data.endDate ?? data.date;
  const when = data.startTime
    ? [
        `DTSTART;TZID=Europe/Nicosia:${compactDay(data.date)}T${data.startTime.replace(":", "")}00`,
        ...(data.endTime
          ? [`DTEND;TZID=Europe/Nicosia:${compactDay(last)}T${data.endTime.replace(":", "")}00`]
          : []),
      ]
    : [`DTSTART;VALUE=DATE:${compactDay(data.date)}`, `DTEND;VALUE=DATE:${compactDay(nextDay(last))}`];
  const location = [text(data.place), data.city && text(data.city)].filter(Boolean).join(", ");
  const description = [text(data.summary), data.url].join("\n\n");
  return [
    "BEGIN:VEVENT",
    `UID:${e.id}@${site.host}`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").slice(0, 15)}Z`,
    ...when,
    `SUMMARY:${escapeText(text(data.title))}`,
    `DESCRIPTION:${escapeText(description)}`,
    `LOCATION:${escapeText(location)}`,
    `URL:${new URL(pageUrl, site).href}`,
    `STATUS:${data.cancelled ? "CANCELLED" : "CONFIRMED"}`,
    "END:VEVENT",
  ];
}

/** A calendar file with `events`; `pageUrl(e)` is the event's place on the site. */
export function toICalendar(
  events: CommunityEvent[],
  lang: Locale,
  site: URL,
  pageUrl: (e: CommunityEvent) => string,
  name?: string,
) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:-//${site.host}//Community events//${lang.toUpperCase()}`,
    "CALSCALE:GREGORIAN",
    ...(name ? [`X-WR-CALNAME:${escapeText(name)}`] : []),
    ...vtimezone,
    ...events.flatMap((e) => vevent(e, lang, site, pageUrl(e))),
    "END:VCALENDAR",
  ];
  return lines.map(fold).join("\r\n") + "\r\n";
}
