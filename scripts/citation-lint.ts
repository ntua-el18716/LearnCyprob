/**
 * Citation lint (PLAN.md §8). Run with `npm run lint:citations`.
 *
 * Errors (exit 1), in issues and site pages:
 * - a <Cite id>, or `sources` of <Status>/<Concern>/<Claim>, naming an
 *   unknown source;
 * - a <Cite anchor> whose source has no library document, or whose document
 *   text has no element with that id;
 * - <Status>, <Concern> or <Claim> without `sources`;
 * - a position whose `option` is not one of its issue's options;
 * - a provision anchor that doesn't exist in its plan's document text;
 * - an issue slug (parent, related, positions, documents, events,
 *   provisions) that matches no issue. Astro validates the other references
 *   at build time; these are plain slugs, so they are checked here.
 *
 * Warnings:
 * - an issue article with no citations;
 * - a status without a <StatusTerm> definition on the methodology page;
 * - a source with a `url` but no `archiveUrl`.
 */
import {
  baseName,
  list,
  load,
  loadAll,
  rel,
  strings,
  type Loaded,
} from "./lib/content.ts";
import { statusGlyphs } from "../src/components/content/status-glyphs.ts";

const errors: string[] = [];
const warnings: string[] = [];

// --- What exists -----------------------------------------------------------

const sources = new Map(
  loadAll("sources", [".yaml"]).map((s) => [baseName(s.file), s]),
);

const issues = loadAll("issues", [".mdx"]);
const issueSlugs = new Set(issues.map((i) => String(i.data.slug)));

// Element ids in each document's texts (any language): <p id="para-1"> etc.
const documentIds = new Map<string, Set<string>>();
for (const file of list("documents", [".md", ".mdx"])) {
  const doc = rel(file).split("/").at(-2) ?? "";
  const ids = documentIds.get(doc) ?? new Set<string>();
  for (const [, id] of load(file).body.matchAll(/\bid=["']([^"']+)["']/g))
    ids.add(id);
  documentIds.set(doc, ids);
}

// --- Citations in issue articles --------------------------------------------

const lineOf = (entry: { body: string; bodyLine: number }, index: number) =>
  entry.bodyLine + entry.body.slice(0, index).split("\n").length - 1;

/** Checks <Cite> and Status/Concern/Claim sources in an MDX body; returns the citation count. */
function checkCitations(entry: Loaded) {
  const where = rel(entry.file);
  let citations = 0;
  for (const m of entry.body.matchAll(/<Cite\b([^>]*)\/?>/g)) {
    citations++;
    const at = `${where}:${lineOf(entry, m.index)}`;
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
      const doc =
        typeof source.data.document === "string"
          ? source.data.document
          : undefined;
      if (!doc) {
        errors.push(
          `${at}: <Cite id="${id}" anchor="${anchor}">: source has no library document to anchor into`,
        );
      } else if (!documentIds.get(doc)?.has(anchor)) {
        errors.push(
          `${at}: <Cite id="${id}" anchor="${anchor}">: no element with id "${anchor}" in documents/${doc}/text.*.md`,
        );
      }
    }
  }

  for (const m of entry.body.matchAll(/<(Status|Concern|Claim)\b([^>]*)>/g)) {
    const at = `${where}:${lineOf(entry, m.index)}`;
    const inner = /\bsources=\{\[([^\]]*)\]\}/.exec(m[2])?.[1];
    const ids = inner
      ? [...inner.matchAll(/["']([^"']+)["']/g)].map((x) => x[1])
      : [];
    if (ids.length === 0)
      errors.push(`${at}: <${m[1]}> needs sources={["source-id"]}`);
    for (const id of ids) {
      citations++;
      if (!sources.has(id))
        errors.push(`${at}: <${m[1]}>: unknown source "${id}"`);
    }
  }
  return citations;
}

for (const issue of issues) {
  const where = rel(issue.file);
  let citations = strings(issue.data.statusSources).length;

  for (const id of strings(issue.data.statusSources)) {
    if (!sources.has(id))
      errors.push(`${where}: statusSources: unknown source "${id}"`);
  }

  citations += checkCitations(issue);

  if (citations === 0) warnings.push(`${where}: no citations`);

  for (const field of ["parent", "related"] as const) {
    const slugs =
      field === "parent"
        ? [issue.data.parent].filter(Boolean).map(String)
        : strings(issue.data.related);
    for (const slug of slugs) {
      if (!issueSlugs.has(slug))
        errors.push(`${where}: ${field}: no issue "${slug}"`);
    }
  }
}

// --- Position boards --------------------------------------------------------------

// Options are defined on the default-locale (EN) issue entry.
const optionIds = new Map(
  issues
    .filter((i) => rel(i.file).split("/").at(-2) === "en")
    .map((i) => [
      String(i.data.slug),
      new Set(
        (Array.isArray(i.data.options)
          ? (i.data.options as { id?: unknown }[])
          : []
        ).map((o) => String(o.id)),
      ),
    ]),
);
for (const file of loadAll("positions", [".yaml"])) {
  const ids = optionIds.get(String(file.data.issue));
  const positions = Array.isArray(file.data.positions)
    ? (file.data.positions as { option?: unknown }[])
    : [];
  if (!ids?.size && positions.length) {
    errors.push(
      `${rel(file.file)}: issue "${String(file.data.issue)}" has no options in its EN file`,
    );
    continue;
  }
  positions.forEach((p, i) => {
    const option = String(p.option);
    if (option !== "no-stated-position" && !ids?.has(option)) {
      errors.push(
        `${rel(file.file)}: positions[${i}]: option "${option}" is not one of the issue's options`,
      );
    }
  });
}

// --- Provisions ---------------------------------------------------------------------

for (const provision of loadAll("provisions", [".yaml"])) {
  const plan = String(provision.data.plan);
  for (const anchor of strings(provision.data.anchors)) {
    if (!documentIds.get(plan)?.has(anchor)) {
      errors.push(
        `${rel(provision.file)}: anchor "${anchor}" not found in documents/${plan}/text.*`,
      );
    }
  }
}

// --- Site pages -----------------------------------------------------------------

for (const page of loadAll("pages", [".mdx"])) checkCitations(page);

// Every status needs a definition on the methodology page (status badges link there).
const methodology = loadAll("pages", [".mdx"]).filter(
  (p) => p.data.slug === "methodology",
);
for (const page of methodology) {
  const defined = new Set(
    [...page.body.matchAll(/<StatusTerm\b[^>]*\bvalue="([^"]+)"/g)].map(
      (m) => m[1],
    ),
  );
  const missing = Object.keys(statusGlyphs).filter((v) => !defined.has(v));
  if (missing.length)
    warnings.push(
      `${rel(page.file)}: no <StatusTerm> for ${missing.join(", ")}`,
    );
}

// --- Issue slugs in other collections ---------------------------------------

const checkIssueSlugs = (dir: string, exts: string[], field: string) => {
  for (const entry of loadAll(dir, exts)) {
    const value = entry.data[field];
    const slugs = typeof value === "string" ? [value] : strings(value);
    for (const slug of slugs) {
      if (!issueSlugs.has(slug))
        errors.push(`${rel(entry.file)}: ${field}: no issue "${slug}"`);
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
    warnings.push(
      `${rel(source.file)}: "${id}" has a url but no archiveUrl (run scripts/archive-source.ts when it exists)`,
    );
  }
}

// --- Report -------------------------------------------------------------------

for (const w of warnings) console.warn(`warning  ${w}`);
for (const e of errors) console.error(`error    ${e}`);
console.log(
  `\nlint:citations: ${issues.length} issues, ${sources.size} sources: ${errors.length} error(s), ${warnings.length} warning(s)`,
);
process.exitCode = errors.length > 0 ? 1 : 0;
