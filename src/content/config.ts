import { defineCollection, z } from "astro:content";

const blogCollection = defineCollection({
  schema: ({ image }) =>
    z.object({
      title: z.string().max(60).min(10),
      hero: image(),
      heroAlt: z.string(),
      description: z.string().max(160),
      pubDate: z.date(),
      updatedDate: z.date().optional(),
    }),
});

const cyprobCollection = defineCollection({
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
  blog: blogCollection,
  cyprob: cyprobCollection,
  document: documentCollection,
};
