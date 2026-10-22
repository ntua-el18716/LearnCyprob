/**
 * Citation lint (PLAN.md §8). Run with `npm run lint:citations`.
 *
 * Errors (exit 1):
 * - a <Cite id>, or `sources` of <Status>/<Concern>/<Claim>, naming an
 *   unknown source;
 * - a <Cite anchor> whose source has no library document, or whose document
 *   text has no element with that id;
 * - <Status>, <Concern> or <Claim> without `sources`;
 * - an issue slug (parent, related, positions, documents, events,
 *   provisions) that matches no issue. Astro validates the other references
 *   at build time; these are plain slugs, so they are checked here.
 *
 * Warnings:
 * - an issue article with no citations;
 * - a source with a `url` but no `archiveUrl`.
 */
import { baseName, list, load, loadAll, rel, strings } from "./lib/content.ts";

const errors: string[] = [];
const warnings: string[] = [];

// --- What exists -----------------------------------------------------------

const sources = new Map(loadAll("sources", [".yaml"]).map((s) => [baseName(s.file), s]));

const issues = loadAll("issues", [".mdx"]);
const issueSlugs = new Set(issues.map((i) => String(i.data.slug)));

// Element ids in each document's texts (any language): <p id="para-1"> etc.
const documentIds = new Map<string, Set<string>>();
for (const file of list("documents", [".md", ".mdx"])) {
  const doc = rel(file).split("/").at(-2) ?? "";
  const ids = documentIds.get(doc) ?? new Set<string>();
  for (const [, id] of load(file).body.matchAll(/\bid=["']([^"']+)["']/g)) ids.add(id);
  documentIds.set(doc, ids);
}

// --- Citations in issue articles --------------------------------------------

const lineOf = (entry: { body: string; bodyLine: number }, index: number) =>
  entry.bodyLine + entry.body.slice(0, index).split("\n").length - 1;

for (const issue of issues) {
  const where = rel(issue.file);
  let citations = strings(issue.data.statusSources).length;

  for (const id of strings(issue.data.statusSources)) {
    if (!sources.has(id)) errors.push(`${where}: statusSources: unknown source "${id}"`);
  }

  for (const m of issue.body.matchAll(/<Cite\b([^>]*)\/?>/g)) {
    citations++;
    const at = `${where}:${lineOf(issue, m.index)}`;
    const id = /\bid="([^"]+)"/.exec(m[1])?.[1];
    const anchor = /\banchor="([^"]+)"/.exec(m[1])?.[1];
    if (!id) {
      errors.push(`${at}: <Cite> without a string id`);
      continue;
    }
    const source = sources.get(id);
    if (!source) {
      errors.push(`${at}: <Cite id="${id}">: unknown source`);
      continue;
    }
    if (anchor) {
      const doc = typeof source.data.document === "string" ? source.data.document : undefined;
      if (!doc) {
        errors.push(`${at}: <Cite id="${id}" anchor="${anchor}">: source has no library document to anchor into`);
      } else if (!documentIds.get(doc)?.has(anchor)) {
        errors.push(`${at}: <Cite id="${id}" anchor="${anchor}">: no element with id "${anchor}" in documents/${doc}/text.*.md`);
      }
    }
  }

  for (const m of issue.body.matchAll(/<(Status|Concern|Claim)\b([^>]*)>/g)) {
    const at = `${where}:${lineOf(issue, m.index)}`;
    const inner = /\bsources=\{\[([^\]]*)\]\}/.exec(m[2])?.[1];
    const ids = inner ? [...inner.matchAll(/["']([^"']+)["']/g)].map((x) => x[1]) : [];
    if (ids.length === 0) errors.push(`${at}: <${m[1]}> needs sources={["source-id"]}`);
    for (const id of ids) {
      citations++;
      if (!sources.has(id)) errors.push(`${at}: <${m[1]}>: unknown source "${id}"`);
    }
  }

  if (citations === 0) warnings.push(`${where}: no citations`);

  for (const field of ["parent", "related"] as const) {
    const slugs = field === "parent" ? [issue.data.parent].filter(Boolean).map(String) : strings(issue.data.related);
    for (const slug of slugs) {
      if (!issueSlugs.has(slug)) errors.push(`${where}: ${field}: no issue "${slug}"`);
    }
  }
}

// --- Issue slugs in other collections ---------------------------------------

const checkIssueSlugs = (dir: string, exts: string[], field: string) => {
  for (const entry of loadAll(dir, exts)) {
    const value = entry.data[field];
    const slugs = typeof value === "string" ? [value] : strings(value);
    for (const slug of slugs) {
      if (!issueSlugs.has(slug)) errors.push(`${rel(entry.file)}: ${field}: no issue "${slug}"`);
    }
  }
};
checkIssueSlugs("positions", [".yaml"], "issue");
checkIssueSlugs("documents", ["index.yaml"], "issues");
checkIssueSlugs("events", [".yaml"], "issues");
checkIssueSlugs("provisions", [".yaml"], "issue");

// --- Sources ------------------------------------------------------------------

for (const [id, source] of sources) {
  if (source.data.url && !source.data.archiveUrl) {
    warnings.push(`${rel(source.file)}: "${id}" has a url but no archiveUrl (run scripts/archive-source.ts when it exists)`);
  }
}

// --- Report -------------------------------------------------------------------

for (const w of warnings) console.warn(`warning  ${w}`);
for (const e of errors) console.error(`error    ${e}`);
console.log(
  `\nlint:citations: ${issues.length} issues, ${sources.size} sources: ${errors.length} error(s), ${warnings.length} warning(s)`,
);
process.exitCode = errors.length > 0 ? 1 : 0;
