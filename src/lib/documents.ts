import { getCollection, getEntry, render, type CollectionEntry } from "astro:content";
import { defaultLocale, type Locale } from "../i18n/locales";
import { isVisible } from "./drafts";
import { getIssue, getIssueSlugs } from "./issues";
import type { Citation } from "./remark-citations";
import type { useTranslations } from "./i18n";

export type Document = CollectionEntry<"documents">;

export async function getDocuments() {
  return (await getCollection("documents", isVisible)).sort(
    (a, b) => b.data.date.valueOf() - a.data.date.valueOf() || a.id.localeCompare(b.id),
  );
}

/** The document's text in `lang`, else in the default locale. */
export async function getDocumentText(slug: string, lang: Locale) {
  // getCollection rather than getEntry: a missing translation is expected.
  const texts = await getCollection("documentTexts", isVisible);
  for (const l of [lang, defaultLocale]) {
    const text = texts.find((e) => e.id === `${slug}/${l}`);
    if (text) return { entry: text, lang: l, isFallback: l !== lang };
  }
  return undefined;
}

/**
 * Formats a document date to the precision its `dateCertainty` allows (drafts
 * may not have one yet; their date is shown as entered).
 */
export function formatDocumentDate(
  date: Date,
  certainty: Document["data"]["dateCertainty"],
  lang: Locale,
  t: ReturnType<typeof useTranslations>,
) {
  const year = new Intl.DateTimeFormat(lang, { year: "numeric" }).format(date);
  switch (certainty) {
    case undefined:
    case "exact":
      return new Intl.DateTimeFormat(lang, { dateStyle: "long" }).format(date);
    case "month":
      return new Intl.DateTimeFormat(lang, { month: "long", year: "numeric" }).format(date);
    case "year":
      return year;
    case "approximate":
      return t("documents.dateCirca", { date: year });
  }
}

/** Issues (in `lang` where possible) whose text cites a source from this document. */
export async function getCitingIssues(documentSlug: string, lang: Locale) {
  const citing: NonNullable<Awaited<ReturnType<typeof getIssue>>>[] = [];
  for (const slug of await getIssueSlugs()) {
    const issue = await getIssue(slug, lang);
    if (!issue) continue;
    const { remarkPluginFrontmatter } = await render(issue.entry);
    const citations = (remarkPluginFrontmatter.citations ?? []) as Citation[];
    for (const { id } of citations) {
      const source = await getEntry("sources", id);
      if (source?.data.document?.id === documentSlug) {
        citing.push(issue);
        break;
      }
    }
  }
  return citing;
}
