# CLAUDE.md

Project: a fact-based, interactive explainer of the Cyprus problem negotiations and of a bizonal, bicommunal federation (BBF). Read `PLAN.md` before doing anything substantial. It is the spec.

## Golden rule: no invented content

The author writes all factual content by hand. When working in this repo, Claude:

- **Never** writes, invents or "fills in" historical facts, dates, quotes, party positions, document contents, statuses or source records.
- May create **placeholder** content only to exercise code. Placeholders must have `draft: true`, use obviously fake text (`TODO(content): …`), and use source IDs prefixed `placeholder-`.
- May *suggest* content changes in chat (e.g. "this claim has no citation"), but does not commit factual text unless the author supplies it verbatim.
- Never removes or rewrites a citation, a status or a position record without being asked.

## Stack

Astro (static) · MDX · React islands · Tailwind · Zod content collections · Pagefind · Cloudflare Pages.

## Commands

```
npm run dev              # local dev server
npm run build            # production build (+ Pagefind index)
npm run check            # astro check + typecheck
npm run lint:citations   # scripts/citation-lint.ts
npm run i18n:status      # scripts/translation-status.ts
```

Run `check`, `lint:citations` and `build` before saying a task is done.

## Conventions

- **Schemas are the source of truth** (`src/content.config.ts`). If a schema changes, update `PLAN.md` §5 and migrate the existing content in the same change.
- **Slugs are stable IDs.** Never rename one without adding a redirect.
- **Citations:** inline `<Cite id="source-id" anchor="para-12" />`. Sources are rendered automatically by `<SourcesList />` in the article layout. Never hand-write a bibliography.
- **Content types are visually distinct:** body text = fact; `<Analysis>` = the site's own argument; `<Concern community="…">` = a sourced criticism; position data comes only from `positions/*.yaml`.
- **Every issue article** has a "Concerns & criticisms" section. The article layout should warn in dev if it is missing.
- **Statuses** use only the `Status` enum and must carry sources.

## i18n

- Locales: `en` (default), `el`; `tr` is planned. The code must not assume only two.
- Put no UI strings in components; use `src/i18n/*.json` via the `t()` helper.
- A missing translation falls back to EN and shows a "not yet translated" banner.
- Test layouts with Greek text (it runs longer) and set the correct `lang` attributes.

## UI and accessibility

- WCAG 2.2 AA. Every chart, board or tree has a semantic table or list fallback that works without JS.
- Never encode meaning with color alone. Party colors appear only next to a text label.
- No flags or "team" color schemes for the communities. The tone is calm and documentary.
- Islands only where interaction is needed; prefer `client:visible`.
- Mobile-first.

## Out of scope unless the author asks

No backend, user accounts, comments, reader submissions, cookies or third-party trackers.

## Commits

Keep code and content changes in separate commits. Use conventional prefixes: `feat:`, `fix:`, `content:`, `schema:`, `i18n:`, `chore:`.