/**
 * Internal link check for the built site (run after `npm run build`):
 * every same-site href must resolve to a file in dist/, and every #fragment
 * to an element id on the target page. External links are not fetched.
 *
 * Broken links fail the check, except on draft pages (robots noindex), where
 * they are reported as warnings: placeholders may point at pages that don't
 * exist yet.
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const dist = join(import.meta.dirname, "..", "dist");
if (!existsSync(dist)) {
  console.error("check:links: dist/ not found; run `npm run build` first.");
  process.exit(1);
}

const pages = readdirSync(dist, { recursive: true, encoding: "utf8" })
  .filter((f) => f.endsWith(".html"))
  .map((f) => join(dist, f));

const html = new Map(pages.map((p) => [p, readFileSync(p, "utf8")]));
const ids = new Map(
  pages.map((p) => [p, new Set([...(html.get(p) ?? "").matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]))]),
);

function resolve(path: string) {
  let file = join(dist, decodeURIComponent(path));
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, "index.html");
  return file;
}

let errors = 0;
let warnings = 0;
for (const page of pages) {
  const text = html.get(page) ?? "";
  const isDraft = /<meta name="robots" content="noindex/.test(text);
  const broken = new Set<string>();
  for (const [, href] of text.matchAll(/href="([^"]+)"/g)) {
    if (/^(https?:|mailto:|tel:|\/\/)/.test(href)) continue;
    const [path, fragment] = href.split("#");
    const target = path ? resolve(path) : page;
    if (!existsSync(target)) broken.add(href);
    else if (fragment && target.endsWith(".html") && !ids.get(target)?.has(fragment)) broken.add(href);
  }
  for (const href of broken) {
    const where = page.slice(dist.length);
    if (isDraft) {
      warnings++;
      console.warn(`warning  ${where} (draft): ${href}`);
    } else {
      errors++;
      console.error(`error    ${where}: ${href}`);
    }
  }
}

console.log(`\ncheck:links: ${pages.length} pages, ${errors} broken link(s), ${warnings} on draft pages`);
process.exitCode = errors > 0 ? 1 : 0;
