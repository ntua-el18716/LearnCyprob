// Share images for the legacy /cyprob and /document pages.
import { getCollection } from "astro:content";
import type { APIContext } from "astro";
import { ogImageResponse } from "../../lib/og";

interface Props {
  title: string;
  pubDate: Date;
}

export function GET(context: APIContext) {
  const { title, pubDate } = context.props as Props;
  return ogImageResponse({
    title,
    kicker: pubDate.toLocaleDateString("en-US", { dateStyle: "full" }),
  });
}

export async function getStaticPaths() {
  const posts = [
    ...(await getCollection("cyprob")),
    ...(await getCollection("document")),
  ];
  return posts.map((post) => ({
    params: { slug: post.id },
    props: {
      title: post.data.title,
      pubDate: post.data.updatedDate ?? post.data.pubDate,
    },
  }));
}
