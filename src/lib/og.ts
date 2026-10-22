import satori from "satori";
import { html } from "satori-html";
import { Resvg } from "@resvg/resvg-js";
import InterRegular from "@fontsource/inter/files/inter-latin-400-normal.woff";
import InterBold from "@fontsource/inter/files/inter-latin-700-normal.woff";
// Latin-only Inter lacks Turkish (ş, ğ, ı) and Greek glyphs; satori falls back through these.
import InterExtRegular from "@fontsource/inter/files/inter-latin-ext-400-normal.woff";
import InterExtBold from "@fontsource/inter/files/inter-latin-ext-700-normal.woff";
import InterGreekRegular from "@fontsource/inter/files/inter-greek-400-normal.woff";
import InterGreekBold from "@fontsource/inter/files/inter-greek-700-normal.woff";

const width = 1200;
const height = 630;

const fonts = (
  [
    ["Inter", InterRegular, 400],
    ["Inter", InterBold, 700],
    ["InterLatinExt", InterExtRegular, 400],
    ["InterLatinExt", InterExtBold, 700],
    ["InterGreek", InterGreekRegular, 400],
    ["InterGreek", InterGreekBold, 700],
  ] as const
).map(([name, data, weight]) => ({ name, data: Buffer.from(data), weight }));

/** A 1200×630 PNG share image: a small line of context above the title. */
export async function ogImageResponse({ title, kicker }: { title: string; kicker: string }) {
  const markup = html`<div
    tw="bg-zinc-900 flex flex-col w-full h-full items-center justify-center p-16"
    style="font-family: Inter, InterLatinExt, InterGreek"
  >
    <div tw="text-zinc-400 text-2xl mb-6">${kicker}</div>
    <div tw="flex text-center text-6xl font-bold leading-snug tracking-tight text-white">
      ${title}
    </div>
  </div>`;

  const svg = await satori(markup as unknown as React.ReactNode, { fonts, width, height });
  const png = new Resvg(svg, { fitTo: { mode: "width", value: width } }).render().asPng();

  return new Response(new Uint8Array(png), { headers: { "Content-Type": "image/png" } });
}
