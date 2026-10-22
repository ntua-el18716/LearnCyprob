/**
 * What's left for the author: `npm run todo` (add `-- --all` to include the
 * placeholder fixtures).
 *
 * Lists every `TODO(content)` marker in src/content, plus tasks derived from
 * the content itself (issues without citations or a "Concerns & criticisms"
 * section, entries still in draft), grouped and ordered by what blocks
 * publication first. A report only: it never fails.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { contentRoot, list, load, rel } from "./lib/content.ts";

const includePlaceholders = process.argv.includes("--all");
const isPlaceholder = (file: string) => /placeholder-/.test(file);

// Section order = priority.
const sections = [
  { dir: "pages", title: "Site pages (About, Methodology, Corrections)" },
  { dir: "issues", title: "Issue articles" },
  { dir: "sources", title: "Sources" },
  { dir: "documents", title: "Documents" },
  { dir: "positions", title: "Positions" },
  { dir: "provisions", title: "Provisions" },
  { dir: "events", title: "Timeline events" },
  { dir: "glossary", title: "Glossary" },
  { dir: "actors", title: "Actors" },
  { dir: "personas", title: "Personas" },
] as const;

const concernsHeading = (lang: string) => {
  try {
    const strings = JSON.parse(
      readFileSync(join(contentRoot, "..", "i18n", `${lang}.json`), "utf8"),
    ) as Record<string, string>;
    return strings["issue.concernsHeading"];
  } catch {
    return undefined;
  }
};

let total = 0;
const out: string[] = [];

for (const { dir, title } of sections) {
  const files = list(dir, [".md", ".mdx", ".yaml"]).filter(
    (f) => includePlaceholders || !isPlaceholder(f),
  );
  const lines: string[] = [];

  for (const file of files) {
    const tasks: string[] = [];
    const text = readFileSync(file, "utf8");
    const fileLines = text.split("\n");
    fileLines.forEach((line, i) => {
      const m = /TODO\(content\):?\s*(.*)$/.exec(line);
      if (!m) return;
      // Drop markup around the note; name the status for <StatusTerm> lines.
      let note = m[1]
        .replace(/<\/?[A-Za-z][^>]*>/g, "")
        .replace(/["`]+$/, "")
        .trim();
      // A YAML comment note may continue on following comment lines, until
      // it ends a sentence.
      for (
        let j = i + 1;
        line.trimStart().startsWith("#") &&
        !/[.!?]$/.test(note) &&
        fileLines[j]?.trimStart().startsWith("#") &&
        !fileLines[j].includes("TODO(content)");
        j++
      ) {
        note += " " + fileLines[j].trim().replace(/^#\s*/, "");
      }
      // Prose that merely mentions the marker ("left as TODO(content).") is not a task.
      if (/^[.,;)]*$/.test(note)) return;
      const status = /<StatusTerm\b[^>]*\bvalue="([^"]+)"/.exec(line)?.[1];
      tasks.push(`${i + 1}: ${status ? `${status}: ` : ""}${note}`);
    });

    if (dir === "issues" && file.endsWith(".mdx")) {
      const entry = load(file);
      const lang = rel(file).split("/").at(-2) ?? "en";
      const heading = concernsHeading(lang) ?? concernsHeading("en");
      if (
        heading &&
        !new RegExp(
          `^##\\s+${heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`,
          "m",
        ).test(entry.body)
      ) {
        tasks.push(`add a "${heading}" section`);
      }
      const cites =
        /<Cite\b|sources=\{\[/.test(entry.body) ||
        (Array.isArray(entry.data.statusSources) &&
          entry.data.statusSources.length > 0);
      if (!cites) tasks.push("add citations (no <Cite> yet)");
    }
    // Document texts follow their index.yaml, which already gets the reminder.
    if (
      /^draft:\s*true\s*$/m.test(text) &&
      !isPlaceholder(file) &&
      !/\/text\.[a-z]+\.mdx?$/.test(file)
    ) {
      tasks.push("still draft: true (set to false once reviewed)");
    }

    if (tasks.length) {
      total += tasks.length;
      lines.push(`  ${rel(file)}`, ...tasks.map((t) => `    - ${t}`));
    }
  }

  if (lines.length) out.push(`\n${title}`, ...lines);
}

console.log(
  `Content to-do: ${total} item(s)${includePlaceholders ? " (including placeholders)" : ""}`,
);
console.log(out.join("\n") || "\nNothing left. 🎉");
console.log(
  "\nAlso: `npm run i18n:status` for translations, `npm run lint:citations` for citation problems.",
);
