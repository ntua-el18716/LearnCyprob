import { getCollection, getEntries, type CollectionEntry } from "astro:content";
import { defaultLocale, type Locale } from "../i18n/locales";
import { isVisible } from "./drafts";
import { localizePath, pickLocalized } from "./i18n";
import { getIssue } from "./issues";
import { actorGroups, groupOf } from "./positions";

type Actor = CollectionEntry<"actors">;
const textOf = (v: { isFallback: boolean; lang: string; text: string }) => ({
  text: v.text,
  lang: v.isFallback ? v.lang : undefined,
});

/** Visible actors in board order: communities, then states, then the rest; by name within a group. */
export async function getActors(lang: Locale) {
  const collator = new Intl.Collator(lang);
  return (await getCollection("actors", isVisible))
    .map((actor) => ({ actor, group: groupOf(actor), name: textOf(pickLocalized(actor.data.name, lang)) }))
    .sort(
      (a, b) =>
        actorGroups.indexOf(a.group) - actorGroups.indexOf(b.group) ||
        collator.compare(a.name.text, b.name.text),
    );
}

/**
 * An actor's recorded positions, grouped by issue (issues by title), each
 * issue's positions oldest first.
 */
export async function getActorPositions(actor: Actor, lang: Locale) {
  const files = await getCollection("positions", isVisible);
  const collator = new Intl.Collator(lang);
  const issues = await Promise.all(
    files
      .filter((f) => f.data.positions.some((p) => p.actor.id === actor.id))
      .map(async (file) => {
        const slug = file.data.issue;
        const issue = await getIssue(slug, lang);
        // Options are defined once, on the default-locale entry.
        const options = (await getIssue(slug, defaultLocale))?.entry.data.options ?? [];
        const positions = await Promise.all(
          file.data.positions
            .filter((p) => p.actor.id === actor.id)
            .sort((a, b) => a.validFrom.valueOf() - b.validFrom.valueOf())
            .map(async (p) => {
              const option = options.find((o) => o.id === p.option);
              return {
                option: option ? textOf(pickLocalized(option.label, lang)) : undefined, // undefined: no stated position
                certainty: p.certainty,
                validFrom: p.validFrom,
                validTo: p.validTo,
                note: p.note && textOf(pickLocalized(p.note, lang)),
                quote: p.quote && {
                  original: p.quote.original,
                  lang: p.quote.lang,
                  translation: p.quote.translation && textOf(pickLocalized(p.quote.translation, lang)),
                },
                sources: (await getEntries(p.sources)).map((s) => ({
                  id: s.id,
                  title: s.data.title,
                  lang: s.data.lang,
                })),
              };
            }),
        );
        return {
          slug,
          title: issue ? { text: issue.entry.data.title, lang: issue.isFallback ? issue.lang : undefined } : { text: slug },
          hasArticle: issue !== undefined,
          board: localizePath(lang, `positions/${slug}`),
          positions,
        };
      }),
  );
  return issues.sort((a, b) => collator.compare(a.title.text, b.title.text));
}

/** Library documents that list the actor as a party, and timeline events that name it. */
export async function getActorLinks(actor: Actor, lang: Locale) {
  const documents = (await getCollection("documents", isVisible))
    .filter((d) => d.data.parties.some((p) => p.id === actor.id))
    .sort((a, b) => a.data.date.valueOf() - b.data.date.valueOf())
    .map((d) => ({ href: localizePath(lang, `documents/${d.id}`), date: d.data.date, title: textOf(pickLocalized(d.data.title, lang)) }));
  const events = (await getCollection("events", isVisible))
    .filter((e) => e.data.actors.some((a) => a.id === actor.id))
    .sort((a, b) => a.data.date.valueOf() - b.data.date.valueOf())
    .map((e) => ({ href: `${localizePath(lang, "timeline")}#${e.id}`, date: e.data.date, title: textOf(pickLocalized(e.data.title, lang)) }));
  return { documents, events };
}
