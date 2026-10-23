import { getCollection } from "astro:content";
import type { Locale } from "../i18n/locales";
import { isVisible } from "./drafts";
import { localizePath, pickLocalized } from "./i18n";
import { getIssue, getIssueSlugs } from "./issues";
import { getPage, getPageSlugs } from "./pages";

/** A place on the site that cites a source. */
export type SourceUse = {
  kind: "issue" | "page" | "event" | "term" | "positions" | "provision";
  href: string;
  label: string;
  lang?: string;
};

// Source ids an MDX body cites: <Cite id="…"> and sources={["…"]} on
// Status/Concern/Claim (the same forms scripts/citation-lint.ts checks).
function citedIn(body: string) {
  const ids = [...body.matchAll(/<Cite\b[^>]*\bid="([^"]+)"/g)].map((m) => m[1]);
  for (const m of body.matchAll(/<(?:Status|Concern|Claim)\b[^>]*\bsources=\{\[([^\]]*)\]\}/g)) {
    ids.push(...[...m[1].matchAll(/["']([^"']+)["']/g)].map((x) => x[1]));
  }
  return ids;
}

/**
 * For each source id, the pages in `lang` that cite it: issue articles, site
 * pages, timeline events, glossary terms, position boards and plan
 * provisions. Each page is listed once per source.
 */
export async function getSourceUses(lang: Locale) {
  const uses = new Map<string, SourceUse[]>();
  const add = (ids: string[], use: SourceUse) => {
    for (const id of new Set(ids)) {
      const list = uses.get(id) ?? [];
      if (!list.some((u) => u.href === use.href)) list.push(use);
      uses.set(id, list);
    }
  };

  for (const slug of await getIssueSlugs()) {
    const issue = await getIssue(slug, lang);
    if (!issue) continue;
    const { data, body = "" } = issue.entry;
    add([...data.statusSources.map((s) => s.id), ...citedIn(body)], {
      kind: "issue",
      href: localizePath(lang, `issues/${slug}`),
      label: data.title,
      lang: issue.isFallback ? issue.lang : undefined,
    });
  }
  for (const slug of await getPageSlugs()) {
    const page = await getPage(slug, lang);
    if (!page) continue;
    add(citedIn(page.entry.body ?? ""), {
      kind: "page",
      href: localizePath(lang, slug),
      label: page.entry.data.title,
      lang: page.isFallback ? page.lang : undefined,
    });
  }
  for (const event of await getCollection("events", isVisible)) {
    const title = pickLocalized(event.data.title, lang);
    add(event.data.sources.map((s) => s.id), {
      kind: "event",
      href: `${localizePath(lang, "timeline")}#${event.id}`,
      label: title.text,
      lang: title.isFallback ? title.lang : undefined,
    });
  }
  for (const term of await getCollection("glossary", isVisible)) {
    const title = pickLocalized(term.data.term, lang);
    add(term.data.sources.map((s) => s.id), {
      kind: "term",
      href: `${localizePath(lang, "glossary")}#${term.data.slug}`,
      label: title.text,
      lang: title.isFallback ? title.lang : undefined,
    });
  }
  for (const file of await getCollection("positions", isVisible)) {
    const issue = await getIssue(file.data.issue, lang);
    add(file.data.positions.flatMap((p) => p.sources.map((s) => s.id)), {
      kind: "positions",
      href: localizePath(lang, `positions/${file.data.issue}`),
      label: issue?.entry.data.title ?? file.data.issue,
      lang: issue?.isFallback ? issue.lang : undefined,
    });
  }
  for (const provision of await getCollection("provisions", isVisible)) {
    const issue = await getIssue(provision.data.issue, lang);
    add(provision.data.sources.map((s) => s.id), {
      kind: "provision",
      href: localizePath(lang, `compare/${provision.data.issue}`),
      label: issue?.entry.data.title ?? provision.data.issue,
      lang: issue?.isFallback ? issue.lang : undefined,
    });
  }
  return uses;
}
