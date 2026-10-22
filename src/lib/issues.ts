import { getCollection, type CollectionEntry } from "astro:content";
import { defaultLocale, type Locale } from "../i18n/locales";
import { isVisible } from "./drafts";

export type Issue = CollectionEntry<"issues">;

const langOf = (issue: Issue) => issue.id.split("/")[0] as Locale;

/** Every visible issue slug, whichever locales it exists in. */
export async function getIssueSlugs() {
  const issues = await getCollection("issues", isVisible);
  return [...new Set(issues.map((i) => i.data.slug))].sort();
}

/**
 * The issue `slug` in `lang`, else in the default locale, else in any locale.
 * `isFallback` is true when the returned entry is not in `lang`.
 */
export async function getIssue(slug: string, lang: Locale) {
  const versions = await getCollection(
    "issues",
    (i) => i.data.slug === slug && isVisible(i),
  );
  const entry =
    versions.find((i) => langOf(i) === lang) ??
    versions.find((i) => langOf(i) === defaultLocale) ??
    versions[0];
  if (!entry) return undefined;
  const entryLang = langOf(entry);
  return { entry, lang: entryLang, isFallback: entryLang !== lang };
}

export type IssueNode = {
  slug: string;
  title: string;
  lang: Locale;
  isFallback: boolean;
  draft: boolean;
  order: number;
  children: IssueNode[];
};

/** All visible issues as a tree (by `parent`), each in `lang` where possible. */
export async function getIssueTree(lang: Locale): Promise<IssueNode[]> {
  const resolved = (
    await Promise.all((await getIssueSlugs()).map((slug) => getIssue(slug, lang)))
  ).filter((r) => r !== undefined);

  const nodes = new Map<string, IssueNode & { parent?: string }>(
    resolved.map(({ entry, lang: entryLang, isFallback }) => [
      entry.data.slug,
      {
        slug: entry.data.slug,
        title: entry.data.title,
        lang: entryLang,
        isFallback,
        draft: entry.data.draft,
        parent: entry.data.parent,
        order: entry.data.order,
        children: [],
      },
    ]),
  );

  const roots: IssueNode[] = [];
  for (const node of nodes.values()) {
    const parent = node.parent ? nodes.get(node.parent) : undefined;
    (parent ? parent.children : roots).push(node);
  }
  const sort = (list: IssueNode[]) => {
    list.sort(
      (a, b) => a.order - b.order || a.title.localeCompare(b.title),
    );
    list.forEach((n) => sort(n.children));
  };
  sort(roots);
  return roots;
}
