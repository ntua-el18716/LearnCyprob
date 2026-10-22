// Share image for an issue page, in the page's language where available.
import type { APIContext } from "astro";
import { publishedLocales, type Locale } from "../../../../i18n/locales";
import { useTranslations } from "../../../../lib/i18n";
import { getIssue, getIssueSlugs } from "../../../../lib/issues";
import { ogImageResponse } from "../../../../lib/og";

export async function getStaticPaths() {
  const slugs = await getIssueSlugs();
  return publishedLocales.flatMap((lang) =>
    slugs.map((slug) => ({ params: { lang, slug } })),
  );
}

export async function GET({ params }: APIContext) {
  const lang = params.lang as Locale;
  const issue = await getIssue(params.slug ?? "", lang);
  if (!issue) return new Response(null, { status: 404 });
  return ogImageResponse({
    title: issue.entry.data.title,
    kicker: useTranslations(lang)("site.title"),
  });
}
