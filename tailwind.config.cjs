/** @type {import('tailwindcss').Config} */
const defaultTheme = require("tailwindcss/defaultTheme");

// Design tokens live in src/styles/global.css as CSS variables (light + dark).
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`;

module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,astro}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: Object.fromEntries(
        ["bg", "ink", "muted", "rule", "control", "accent", "on-accent", "panel", "sunken"].map(
          (n) => [n, token(n)],
        ),
      ),
      fontFamily: {
        // Commissioner covers Greek and Turkish (PLAN.md §10).
        sans: ["Commissioner Variable", ...defaultTheme.fontFamily.sans],
      },
      maxWidth: {
        // Reading measure for body text.
        prose: "40rem",
      },
      typography: () => ({
        site: {
          css: {
            "--tw-prose-body": "rgb(var(--ink))",
            "--tw-prose-headings": "rgb(var(--ink))",
            "--tw-prose-lead": "rgb(var(--muted))",
            "--tw-prose-links": "rgb(var(--ink))",
            "--tw-prose-bold": "rgb(var(--ink))",
            "--tw-prose-counters": "rgb(var(--muted))",
            "--tw-prose-bullets": "rgb(var(--muted))",
            "--tw-prose-hr": "rgb(var(--rule))",
            "--tw-prose-quotes": "rgb(var(--ink))",
            "--tw-prose-quote-borders": "rgb(var(--accent))",
            "--tw-prose-captions": "rgb(var(--muted))",
            "--tw-prose-th-borders": "rgb(var(--accent))",
            "--tw-prose-td-borders": "rgb(var(--rule))",
            fontSize: "1.15rem",
            lineHeight: "1.7",
            a: {
              textDecorationColor: "rgb(var(--accent) / 0.6)",
              textUnderlineOffset: "3px",
              fontWeight: "500",
              "&:hover": { textDecorationColor: "rgb(var(--accent))", textDecorationThickness: "2px" },
            },
            "h2, h3": { fontWeight: "720", letterSpacing: "-0.01em", scrollMarginTop: "1.5rem", position: "relative" },
            h2: { fontSize: "1.65em" },
            blockquote: {
              fontStyle: "normal",
              fontWeight: "500",
              borderLeftWidth: "4px",
              quotes: "none",
            },
            "blockquote p:first-of-type::before, blockquote p:last-of-type::after": { content: "none" },
            "thead th": { borderBottomWidth: "2px" },
            // Heading anchors sit in the left margin so headings never shift.
            ".anchor-link": {
              position: "absolute",
              right: "100%",
              paddingRight: "0.4rem",
              opacity: "0",
              textDecoration: "none !important",
              color: "rgb(var(--muted))",
            },
            "h2:hover .anchor-link, h3:hover .anchor-link, .anchor-link:focus-visible": { opacity: "1" },
            "code::before": { content: '""' },
            "code::after": { content: '""' },
            ":not(pre) > code": {
              backgroundColor: "rgb(var(--sunken))",
              padding: "0.15rem 0.35rem",
              borderRadius: "0.25rem",
              fontWeight: "400",
            },
          },
        },
      }),
    },
  },
  plugins: [require("@tailwindcss/typography"), require("@tailwindcss/aspect-ratio")],
};
