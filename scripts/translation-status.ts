/**
 * Translation status (PLAN.md §8). Run with `npm run i18n:status`.
 *
 * For every issue, each non-default locale is reported as:
 * - missing: no file in src/content/issues/{lang}/;
 * - stale:   `translationOf.revision` is not the EN file's last commit;
 * - current: it is.
 * Also lists document texts per locale and UI strings missing from
 * src/i18n/{lang}.json. A report only: it never fails.
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { defaultLocale, locales, publishedLocales } from "../src/i18n/locales.ts";
import { baseName, contentRoot, list, loadAll, rel, type Loaded } from "./lib/content.ts";

const others = locales.filter((l) => l !== defaultLocale);
const published = new Set<string>(publishedLocales);
const tag = (lang: string) => (published.has(lang) ? lang : `${lang} (not published)`);

function lastCommit(file: string) {
  try {
    const out = execFileSync("git", ["log", "-1", "--format=%H", "--", file], { encoding: "utf8" }).trim();
    return out || undefined;
  } catch {
    return undefined;
  }
}

// --- Issues --------------------------------------------------------------------

const issues = loadAll("issues", [".mdx"]);
const byLang = new Map<string, Map<string, Loaded>>();
for (const issue of issues) {
  const lang = rel(issue.file).split("/").at(-2) ?? "";
  const map = byLang.get(lang) ?? new Map<string, Loaded>();
  map.set(String(issue.data.slug), issue);
  byLang.set(lang, map);
}
const reference = byLang.get(defaultLocale) ?? new Map<string, Loaded>();
const allSlugs = [...new Set(issues.map((i) => String(i.data.slug)))].sort();

console.log(`Issues (${allSlugs.length}), compared with ${defaultLocale}:\n`);
const totals: Record<string, { current: number; stale: number; missing: number }> = {};
for (const lang of others) totals[lang] = { current: 0, stale: 0, missing: 0 };

for (const slug of allSlugs) {
  const source = reference.get(slug);
  if (!source) {
    console.log(`  ${slug}: no ${defaultLocale} version (translations have nothing to track)`);
    continue;
  }
  const head = lastCommit(source.file);
  const states = others.map((lang) => {
    const translation = byLang.get(lang)?.get(slug);
    if (!translation) {
      totals[lang].missing++;
      return `${lang}: missing`;
    }
    const revision = (translation.data.translationOf as { revision?: string } | undefined)?.revision;
    if (head && revision && head.startsWith(revision)) {
      totals[lang].current++;
      return `${lang}: current`;
    }
    totals[lang].stale++;
    const why = !revision ? "no translationOf.revision" : !head ? `${defaultLocale} file not committed` : `revision ${revision.slice(0, 7)}, ${defaultLocale} is at ${head.slice(0, 7)}`;
    return `${lang}: stale (${why})`;
  });
  console.log(`  ${slug}: ${states.join("; ")}`);
}

console.log("");
for (const lang of others) {
  const t = totals[lang];
  console.log(`  ${tag(lang)}: ${t.current} current, ${t.stale} stale, ${t.missing} missing`);
}

// --- Document texts -------------------------------------------------------------

const texts = list("documents", [".md"]).map((f) => ({
  doc: rel(f).split("/").at(-2) ?? "",
  lang: baseName(f).replace(/^text\./, ""),
}));
const docs = [...new Set(texts.map((t) => t.doc))].sort();
console.log(`\nDocument texts (${docs.length}):\n`);
for (const doc of docs) {
  const have = texts.filter((t) => t.doc === doc).map((t) => t.lang);
  const missing = others.filter((l) => !have.includes(l));
  console.log(`  ${doc}: ${have.sort().join(", ")}${missing.length ? ` (missing ${missing.join(", ")})` : ""}`);
}

// --- UI strings ----------------------------------------------------------------

const i18nDir = join(contentRoot, "..", "i18n");
const readStrings = (lang: string) =>
  JSON.parse(readFileSync(join(i18nDir, `${lang}.json`), "utf8")) as Record<string, string>;
const keys = Object.keys(readStrings(defaultLocale));
console.log(`\nUI strings (${keys.length} keys in ${defaultLocale}.json):\n`);
for (const lang of others) {
  const have = readStrings(lang);
  const missing = keys.filter((k) => !(k in have));
  const extra = Object.keys(have).filter((k) => !keys.includes(k));
  console.log(`  ${tag(lang)}: ${keys.length - missing.length}/${keys.length} translated`);
  if (published.has(lang) && missing.length) console.log(`    missing: ${missing.join(", ")}`);
  if (extra.length) console.log(`    not in ${defaultLocale}.json (unused): ${extra.join(", ")}`);
}
