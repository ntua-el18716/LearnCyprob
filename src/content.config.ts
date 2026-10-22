import { defineCollection, reference } from "astro:content";
import { z } from "astro/zod";
import { glob } from "astro/loaders";
import { defaultLocale, locales, type Locale } from "./i18n/locales";

// ---------------------------------------------------------------------------
// Shared types (PLAN.md §5)
// ---------------------------------------------------------------------------

// The default locale is required, every other locale optional, unknown keys
// rejected. Built from `locales` so adding a locale needs no change here.
const localized = z.strictObject(
  Object.fromEntries(
    locales.map((l) => [
      l,
      l === defaultLocale ? z.string().min(1) : z.string().min(1).optional(),
    ]),
  ) as {
    [L in Locale]: L extends typeof defaultLocale
      ? z.ZodString
      : z.ZodOptional<z.ZodString>;
  },
);

const status = z.enum([
  "agreed", // formally agreed text
  "converged", // convergence recorded in the talks
  "partially-converged",
  "convergence-disputed", // one side disputes that convergence exists
  "divergent",
  "proposal-only", // in a UN or side proposal, not converged
  "not-discussed",
]);

const certainty = z.enum(["official", "leader-statement", "reported", "inferred"]);

const era = z.enum([
  "pre-1955",
  "1955-1960",
  "1960-1963",
  "1963-1974",
  "1974-1977",
  "1977-1990",
  "1990-1999",
  "1999-2004",
  "2004-2008",
  "2008-2013",
  "2014-2017",
  "2017-present",
]);

const community = z.enum(["gc", "tc", "maronite", "armenian", "latin", "none"]);

const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "must be a kebab-case slug");

// Issues are stored per locale, so their entry ids are `{lang}/{slug}`. Other
// collections point at an issue by its locale-independent slug instead of a
// reference(); cross-collection checks for these live in scripts/citation-lint.ts.
const issueSlug = slug;

const date = z.coerce.date();

// Every collection carries `draft` so placeholder entries can be marked and
// filtered out (CLAUDE.md).
const draft = z.boolean().default(false);

const sources = z.array(reference("sources"));

// ---------------------------------------------------------------------------
// Collections
// ---------------------------------------------------------------------------

const issueOption = z.object({
  id: slug, // e.g. "rotation-2-1-cross-voting"
  label: localized,
  description: localized,
});

// src/content/issues/{lang}/{slug}.mdx
const issues = defineCollection({
  loader: glob({
    pattern: "*/*.mdx",
    base: "./src/content/issues",
    generateId: ({ entry, data }) => {
      const [lang, file] = entry.split("/");
      const fileSlug = file.replace(/\.mdx$/, "");
      if (!(locales as readonly string[]).includes(lang)) {
        throw new Error(`issues/${entry}: folder "${lang}" is not a locale (${locales.join(", ")})`);
      }
      if (data.slug !== fileSlug) {
        throw new Error(`issues/${entry}: frontmatter slug "${String(data.slug)}" must match the file name`);
      }
      return `${lang}/${fileSlug}`;
    },
  }),
  schema: z
    .object({
      slug: issueSlug,
      title: z.string().min(1),
      summary: z.string().min(1), // one line, used in the explorer and cards
      parent: issueSlug.optional(),
      order: z.number(),
      related: z.array(issueSlug).default([]),
      status: status.optional(), // overall state in the talks
      statusSources: sources.default([]),
      options: z.array(issueOption).optional(), // enables a position board
      lastReviewed: date,
      translationOf: z
        .object({ lang: z.literal(defaultLocale), revision: z.string().min(1) })
        .optional(), // for stale-translation checks
      draft,
    })
    .refine((issue) => !issue.status || issue.statusSources.length > 0, {
      error: "statusSources is required when status is set",
      path: ["statusSources"],
    }),
});

// src/content/actors/{slug}.yaml
const actors = defineCollection({
  loader: glob({ pattern: "*.yaml", base: "./src/content/actors" }),
  schema: z.object({
    slug,
    name: localized,
    shortName: localized, // "AKEL", "CTP"
    type: z.enum([
      "community-leader",
      "party",
      "government",
      "guarantor",
      "international-org",
      "person",
    ]),
    community: community.optional(),
    active: z.object({ from: date, to: date.optional() }),
    color: z.string().optional(), // secondary marker only, never the sole identifier
    logo: z.string().optional(), // optional; check usage rights
    draft,
  }),
});

const position = z.object({
  actor: reference("actors"),
  option: z.string().min(1), // IssueOption.id, or "no-stated-position"
  certainty,
  validFrom: date,
  validTo: date.optional(),
  quote: z
    .object({
      original: z.string().min(1),
      lang: z.string().min(2),
      translation: localized.optional(),
    })
    .optional(),
  note: localized.optional(), // nuance: "supports only with cross-voting"
  sources: sources.min(1),
});

// src/content/positions/{issue-slug}.yaml
const positions = defineCollection({
  loader: glob({ pattern: "*.yaml", base: "./src/content/positions" }),
  schema: z.object({
    issue: issueSlug,
    positions: z.array(position),
    draft,
  }),
});

// src/content/documents/{slug}/index.yaml
const documents = defineCollection({
  loader: glob({
    pattern: "*/index.yaml",
    base: "./src/content/documents",
    generateId: ({ entry }) => entry.split("/")[0],
  }),
  schema: z.object({
    slug,
    title: localized,
    originalTitle: z.string().optional(),
    date,
    dateCertainty: z.enum(["exact", "month", "year", "approximate"]),
    type: z.enum([
      "treaty",
      "constitution",
      "un-plan",
      "un-report",
      "unsc-resolution",
      "high-level-agreement",
      "joint-statement",
      "set-of-ideas",
      "leaked",
      "court-judgment",
      "eu-act",
      "proposal",
      "other",
    ]),
    parties: z.array(reference("actors")).default([]),
    issues: z.array(issueSlug).default([]),
    versions: z
      .array(
        z.object({
          id: z.string().min(1),
          label: z.string().min(1),
          date,
          file: z.string().min(1),
          text: z.string().optional(),
        }),
      )
      .optional(),
    files: z.array(
      z.object({
        lang: z.string().min(2),
        path: z.string().min(1),
        kind: z.enum(["original", "translation", "scan"]),
      }),
    ),
    provenance: localized, // where it comes from; for leaks, who published it first
    isLeaked: z.boolean(),
    officialUrl: z.url().optional(),
    archiveUrl: z.url().optional(),
    copyrightNote: z.string().optional(),
    draft,
  }),
});

// src/content/documents/{slug}/text.{lang}.md (paragraph-anchored text)
const documentTexts = defineCollection({
  loader: glob({
    pattern: "*/text.*.md",
    base: "./src/content/documents",
    generateId: ({ entry }) => {
      const [doc, file] = entry.split("/");
      const lang = file.replace(/^text\.|\.md$/g, "");
      return `${doc}/${lang}`;
    },
  }),
  schema: z.object({ draft }),
});

// src/content/sources/{id}.yaml
const sourcesCollection = defineCollection({
  loader: glob({ pattern: "*.yaml", base: "./src/content/sources" }),
  schema: z.object({
    title: z.string().min(1),
    author: z.string().optional(),
    publisher: z.string().min(1),
    date,
    url: z.url().optional(),
    archiveUrl: z.url().optional(), // Wayback snapshot; citation lint warns if url is set without it
    type: z.enum([
      "primary-official",
      "primary-leaked",
      "un",
      "eu",
      "court",
      "news",
      "academic",
      "party-statement",
      "interview",
      "poll",
      "other",
    ]),
    lang: z.string().min(2),
    document: reference("documents").optional(), // when the source is in the library
    accessed: date,
    draft,
  }),
});

// src/content/events/{yyyy-mm-dd}-{slug}.yaml
const events = defineCollection({
  loader: glob({ pattern: "*.yaml", base: "./src/content/events" }),
  schema: z.object({
    date,
    dateCertainty: z.enum(["exact", "month", "year"]),
    endDate: date.optional(),
    title: localized,
    summary: localized,
    era,
    importance: z.union([z.literal(1), z.literal(2), z.literal(3)]), // zoom-level visibility
    issues: z.array(issueSlug).default([]),
    actors: z.array(reference("actors")).default([]),
    documents: z.array(reference("documents")).default([]),
    sources,
    draft,
  }),
});

// src/content/provisions/{plan-slug}/{issue-slug}.yaml
const provisions = defineCollection({
  loader: glob({ pattern: "*/*.yaml", base: "./src/content/provisions" }),
  schema: z.object({
    plan: reference("documents"), // Annan V, Guterres framework, Set of Ideas...
    issue: issueSlug,
    summary: localized,
    anchors: z.array(z.string().min(1)).default([]), // paragraph anchors in the document text
    status, // its status in that process; statuses must carry sources
    sources: sources.min(1),
    isReferenceModel: z.boolean(), // part of the "after a solution" baseline
    draft,
  }),
});

// src/content/glossary/{slug}.yaml
const glossary = defineCollection({
  loader: glob({ pattern: "*.yaml", base: "./src/content/glossary" }),
  schema: z.object({
    slug,
    term: localized,
    definition: localized,
    usage: z
      .array(
        z.object({
          community: z.enum(["gc", "tc", "international"]),
          term: localized,
          note: localized.optional(),
        }),
      )
      .optional(),
    sources,
    draft,
  }),
});

// src/content/personas/{slug}.yaml (phase 3)
const personas = defineCollection({
  loader: glob({ pattern: "*.yaml", base: "./src/content/personas" }),
  schema: z.object({
    slug,
    title: localized, // "Displaced Greek Cypriot with property in the north"
    intro: localized,
    steps: z.array(
      z.object({
        question: localized,
        provisions: z.array(reference("provisions")),
        explanation: localized,
      }),
    ),
    draft,
  }),
});

// ---------------------------------------------------------------------------
// Legacy collections (pre-PLAN.md). Removed once their content has moved.
// ---------------------------------------------------------------------------

const cyprobCollection = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "./src/content/cyprob" }),
  schema: ({ image }) =>
    z.object({
      title: z.string().max(60).min(10),
      hero: image(),
      heroAlt: z.string(),
      description: z.string().max(160),
      pubDate: z.date(),
      updatedDate: z.date().optional(),
      tags: z.array(z.string()).optional(),
    }),
});

const documentCollection = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "./src/content/document" }),
  schema: ({ image }) =>
    z.object({
      title: z.string().max(75).min(10),
      hero: image(),
      heroAlt: z.string(),
      numOfImages: z.number(),
      documentImages: z.array(image()),
      description: z.string().max(160),
      pubDate: z.date(),
      updatedDate: z.date().optional(),
      documentDate: z.date().optional(),
      source: z.string().optional(),
      tags: z.array(z.string()).optional(),
    }),
});

export const collections = {
  issues,
  actors,
  positions,
  documents,
  documentTexts,
  sources: sourcesCollection,
  events,
  provisions,
  glossary,
  personas,
  cyprob: cyprobCollection,
  document: documentCollection,
};
