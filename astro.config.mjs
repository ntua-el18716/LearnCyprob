import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import { readFileSync } from "node:fs";
import icon from "astro-icon";
import mdx from "@astrojs/mdx";
import { unified } from "@astrojs/markdown-remark";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import { remarkReadingTime } from "./remark-reading-time.mjs";
import { remarkCitations } from "./src/lib/remark-citations.ts";
import react from "@astrojs/react";
import { defaultLocale, locales, publishedLocales } from "./src/i18n/locales.ts";

// Old URLs (before the move to /{lang}/issues and /{lang}/documents). A fixed,
// historical list: new content never needs an entry here.
const legacyIssues = ["bbf", "bizonality", "political-equality", "rotating-presidency", "security-guarantees", "troops"];
const legacyDocuments = [
  "anastasiades-eroglu-joint-declaration",
  "crans-montana-anastasiades-guterres",
  "crans-montana-cavusoglu-guterres-1",
  "crans-montana-cavusoglu-guterres-2",
  "crans-montana-dinner",
  "crans-montana-implementation-framework-non-paper",
  "crans-montana-kotzias-guterres",
  "crans-montana-mogherini-gutteres",
  "downer-document",
  "guterres-framework-4th-july",
  "papadopoulos-talat-set-of-principles",
  "un-report-1990",
];
const legacyRedirects = {
  "/cyprob": "/en/issues/",
  "/document": "/en/documents/",
  ...Object.fromEntries(legacyIssues.map((s) => [`/cyprob/${s}`, `/en/issues/${s}/`])),
  ...Object.fromEntries(legacyDocuments.map((s) => [`/document/${s}`, `/en/documents/${s}/`])),
};

// https://astro.build/config
export default defineConfig({
  redirects: legacyRedirects,
  markdown: {
    // Astro 7 defaults to Sätteri; the unified processor keeps our remark/rehype plugins.
    processor: unified({
      remarkPlugins: [remarkReadingTime, remarkCitations],
      rehypePlugins: [
        rehypeSlug,
        [
          rehypeAutolinkHeadings,
          {
            behavior: "prepend",
            content: {
              type: "text",
              value: "#",
            },
            headingProperties: {
              className: ["anchor"],
            },
            properties: {
              className: ["anchor-link mr-5"],
            },
          },
        ],
      ],
    }),
  },
  // Astro 7 defaults to "jsx", which strips whitespace between inline elements.
  compressHTML: true,
  i18n: {
    locales: [...locales],
    defaultLocale,
    // Every locale, including the default, lives under /{lang}/. The root page
    // (src/pages/index.astro) picks a language itself.
    routing: { prefixDefaultLocale: true, redirectToDefaultLocale: false },
  },
  integrations: [
    sitemap({
      i18n: {
        defaultLocale,
        locales: Object.fromEntries(publishedLocales.map((l) => [l, l])),
      },
    }),
    icon(),
    mdx(),
    react(),
  ],
  // TODO: site name and domain are still open (PLAN.md §14).
  site: "https://astrozinc.exylons.com",
  vite: {
    plugins: [rawFonts([".ttf", ".woff"])],
    optimizeDeps: {
      exclude: ["@resvg/resvg-js"],
    },
  },
  output: "static",
});

// vite plugin to import fonts
function rawFonts(ext) {
  return {
    name: "vite-plugin-raw-fonts",
    transform(_, id) {
      if (ext.some((e) => id.endsWith(e))) {
        const buffer = readFileSync(id);
        return {
          code: `export default ${JSON.stringify(buffer)}`,
          map: null,
        };
      }
    },
  };
}
