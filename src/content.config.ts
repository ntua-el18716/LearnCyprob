import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { glob } from "astro/loaders";

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
  cyprob: cyprobCollection,
  document: documentCollection,
};
