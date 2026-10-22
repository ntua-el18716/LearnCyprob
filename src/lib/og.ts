import satori from "satori";
import { html } from "satori-html";
import { Resvg } from "@resvg/resvg-js";
import LatinRegular from "@fontsource/commissioner/files/commissioner-latin-400-normal.woff";
import LatinBold from "@fontsource/commissioner/files/commissioner-latin-700-normal.woff";
// Satori falls back between font families only, so each subset gets its own
// family name: latin-ext covers Turkish (ş, ğ, ı), greek covers Greek.
import ExtRegular from "@fontsource/commissioner/files/commissioner-latin-ext-400-normal.woff";
import ExtBold from "@fontsource/commissioner/files/commissioner-latin-ext-700-normal.woff";
import GreekRegular from "@fontsource/commissioner/files/commissioner-greek-400-normal.woff";
import GreekBold from "@fontsource/commissioner/files/commissioner-greek-700-normal.woff";

const width = 1200;
const height = 630;

const fonts = (
  [
    ["Latin", LatinRegular, 400],
    ["Latin", LatinBold, 700],
    ["LatinExt", ExtRegular, 400],
    ["LatinExt", ExtBold, 700],
    ["Greek", GreekRegular, 400],
    ["Greek", GreekBold, 700],
  ] as const
).map(([name, data, weight]) => ({ name, data: Buffer.from(data), weight }));

/** A 1200×630 PNG share image: a small line of context above the title. */
export async function ogImageResponse({ title, kicker }: { title: string; kicker: string }) {
  // Brand colours from src/styles/global.css (light theme).
  const markup = html`<div
    tw="flex flex-col w-full h-full justify-between p-16"
    style="font-family: Latin, LatinExt, Greek; background: #1f5f5b; color: #ffffff"
  >
    <div tw="text-3xl" style="opacity: 0.85">${kicker}</div>
    <div tw="flex text-7xl font-bold leading-tight" style="letter-spacing: -0.02em">${title}</div>
    <div tw="flex w-full" style="height: 6px; background: rgba(255,255,255,0.35)"></div>
  </div>`;

  const svg = await satori(markup as unknown as React.ReactNode, { fonts, width, height });
  const png = new Resvg(svg, { fitTo: { mode: "width", value: width } }).render().asPng();

  return new Response(new Uint8Array(png), { headers: { "Content-Type": "image/png" } });
}
