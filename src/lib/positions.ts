import { getCollection, getEntries, getEntry, type CollectionEntry } from "astro:content";
import { defaultLocale, type Locale } from "../i18n/locales";
import { isVisible } from "./drafts";
import { localizePath, pickLocalized } from "./i18n";
import { getIssue } from "./issues";

type Actor = CollectionEntry<"actors">;

// Row groups, in display order. Communities first, then states, then the rest.
export const actorGroups = ["gc", "tc", "states", "international", "other"] as const;
export type ActorGroup = (typeof actorGroups)[number];

function groupOf(actor: Actor): ActorGroup {
  const { community, type } = actor.data;
  if (community === "gc" || community === "tc") return community;
  if (type === "government" || type === "guarantor") return "states";
  if (type === "international-org") return "international";
  return "other";
}

const iso = (d: Date) => d.toISOString().slice(0, 10);
const textOf = (v: { isFallback: boolean; lang: string; text: string }) => ({
  text: v.text,
  lang: v.isFallback ? v.lang : undefined,
});

/**
 * Everything the position board needs for one issue, as plain JSON (it is
 * passed to a React island). Undefined when the issue has no options or no
 * positions file.
 */
export async function getPositionBoard(issueSlug: string, lang: Locale) {
  const issue = await getIssue(issueSlug, lang);
  // Options are Localized data, defined once on the default-locale entry;
  // translated issue files don't repeat them.
  const options = (await getIssue(issueSlug, defaultLocale))?.entry.data.options;
  if (!issue || !options?.length) return undefined;
  const file = await getEntry("positions", issueSlug);
  if (!file || !isVisible(file)) return undefined;

  const actorIds = [...new Set(file.data.positions.map((p) => p.actor.id))];
  const actors = (await getCollection("actors", (a) => actorIds.includes(a.id))).map((a) => ({
    id: a.id,
    name: textOf(pickLocalized(a.data.name, lang)),
    shortName: textOf(pickLocalized(a.data.shortName, lang)),
    group: groupOf(a),
    color: a.data.color,
  }));
  const collator = new Intl.Collator(lang);
  actors.sort(
    (a, b) =>
      actorGroups.indexOf(a.group) - actorGroups.indexOf(b.group) ||
      collator.compare(a.name.text, b.name.text),
  );

  const positions = await Promise.all(
    file.data.positions.map(async (p, i) => ({
      key: `${p.actor.id}-${i}`,
      actor: p.actor.id,
      option: p.option,
      certainty: p.certainty,
      validFrom: iso(p.validFrom),
      validTo: p.validTo ? iso(p.validTo) : undefined,
      quote: p.quote && {
        original: p.quote.original,
        lang: p.quote.lang,
        translation: p.quote.translation && textOf(pickLocalized(p.quote.translation, lang)),
      },
      note: p.note && textOf(pickLocalized(p.note, lang)),
      sources: (await getEntries(p.sources)).map((s) => ({
        title: s.data.title,
        lang: s.data.lang,
        href:
          s.data.url ??
          (s.data.document ? localizePath(lang, `documents/${s.data.document.id}`) : undefined),
      })),
    })),
  );

  // The dates at which something changes; the slider steps through these.
  const dates = [
    ...new Set(positions.flatMap((p) => (p.validTo ? [p.validFrom, p.validTo] : [p.validFrom]))),
  ].sort();

  return {
    issue: { slug: issueSlug, title: issue.entry.data.title, lang: issue.isFallback ? issue.lang : undefined },
    options: options.map((o) => ({
      id: o.id,
      label: textOf(pickLocalized(o.label, lang)),
      description: textOf(pickLocalized(o.description, lang)),
    })),
    actors,
    positions,
    dates,
    draft: file.data.draft,
  };
}

export type PositionBoardData = NonNullable<Awaited<ReturnType<typeof getPositionBoard>>>;

/** Issue slugs that have a position board. */
export async function getPositionBoardSlugs() {
  const files = await getCollection("positions", isVisible);
  return files.map((f) => f.id);
}
