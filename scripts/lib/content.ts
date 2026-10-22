// Minimal content reader for scripts that run outside Astro (plain Node).
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, relative } from "node:path";
import { parse } from "yaml";

export const contentRoot = join(import.meta.dirname, "..", "..", "src", "content");

/** `bodyLine` is the 1-based file line where `body` starts (after frontmatter). */
export type Loaded = { file: string; data: Record<string, unknown>; body: string; bodyLine: number };

/** Files under src/content/{dir} (recursive) whose name ends with one of `exts`. */
export function list(dir: string, exts: string[]): string[] {
  const root = join(contentRoot, dir);
  if (!existsSync(root)) return [];
  return readdirSync(root, { recursive: true, encoding: "utf8" })
    .filter((f) => exts.some((e) => f.endsWith(e)))
    .map((f) => join(root, f))
    .sort();
}

/** Reads YAML data files, or markdown/MDX with YAML frontmatter. */
export function load(file: string): Loaded {
  const text = readFileSync(file, "utf8");
  if (file.endsWith(".yaml") || file.endsWith(".yml")) {
    return { file, data: (parse(text) as Record<string, unknown> | null) ?? {}, body: "", bodyLine: 1 };
  }
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(text);
  if (!match) return { file, data: {}, body: text, bodyLine: 1 };
  const bodyLine = text.slice(0, text.length - match[2].length).split("\n").length;
  return {
    file,
    data: (parse(match[1]) as Record<string, unknown> | null) ?? {},
    body: match[2],
    bodyLine,
  };
}

export function loadAll(dir: string, exts: string[]) {
  return list(dir, exts).map(load);
}

/** Path relative to the repo root, for messages. */
export function rel(file: string) {
  return relative(join(contentRoot, "..", ".."), file);
}

/** File name without directory and extension. */
export function baseName(file: string) {
  return (file.split("/").pop() ?? file).replace(/\.[^.]+$/, "");
}

export function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}
