import { getCollection, getEntry, type CollectionEntry } from "astro:content";
import type { Locale } from "../i18n/locales";
import { isVisible } from "./drafts";
import { pickLocalized } from "./i18n";
import { getIssueTree, type IssueNode } from "./issues";

export type Provision = CollectionEntry<"provisions">;

// Issues in tree order (parents before children, siblings by `order`).
function flatten(nodes: IssueNode[]): IssueNode[] {
  return nodes.flatMap((n) => [n, ...flatten(n.children)]);
}

/**
 * Issue × plan comparison: plans (documents some provision belongs to) by
 * date, issues with at least one provision in tree order, and the provision
 * for each pair.
 */
export async function getComparison(lang: Locale) {
  const provisions = await getCollection("provisions", isVisible);

  const planIds = [...new Set(provisions.map((p) => p.data.plan.id))];
  const plans = (
    await Promise.all(
      planIds.map(async (id) => {
        const doc = await getEntry("documents", id);
        if (!doc || !isVisible(doc)) return undefined;
        const title = pickLocalized(doc.data.title, lang);
        return { id, title: title.text, lang: title.isFallback ? title.lang : undefined, date: doc.data.date };
      }),
    )
  )
    .filter((p) => p !== undefined)
    .sort((a, b) => a.date.valueOf() - b.date.valueOf() || a.id.localeCompare(b.id));

  const issueSlugs = new Set(provisions.map((p) => p.data.issue));
  const issues = flatten(await getIssueTree(lang)).filter((n) => issueSlugs.has(n.slug));

  const cell = (issue: string, plan: string) =>
    provisions.find((p) => p.data.issue === issue && p.data.plan.id === plan);

  return { plans, issues, cell };
}
