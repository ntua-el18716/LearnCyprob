# Cyprus Problem Explainer: Project Plan

> Working name: **TBD** (domain TBD). Replace throughout once chosen.

## 1. Purpose

A fact-based, source-heavy, interactive website that explains the Cyprus problem negotiations, and especially what a **bizonal, bicommunal federation (BBF)** settlement would actually contain and what life after a solution would look like.

### Editorial stance

- The site is **openly pro-BBF**, and says so on the About and Methodology pages.
- It is **pro-BBF without pinkwashing**: costs, risks, trade-offs and criticisms are presented honestly and with sources. Credibility is the product.
- Three kinds of content are always visually distinguishable:
  1. **Fact**: the default body text. Every factual claim is cited.
  2. **Position**: what an actor (party, leader, government, UN) says. It is attributed, dated and sourced.
  3. **Analysis**: the site's own argument or interpretation, including the pro-BBF voice. It always sits inside a labeled `<Analysis>` block.
- Every issue article has a mandatory **"Concerns & criticisms"** section. It covers concerns from each community, each one sourced, with an optional site response inside `<Analysis>`.
- Nothing is presented as agreed unless it is agreed. Every provision carries a **status** (see the content model below).

### Audience

The general public in both communities and the diaspora, journalists, students, and anyone who will face a referendum.

### Languages

- Launch: **English + Greek**.
- Goal: **Turkish** added later. The architecture supports three locales from day one.
- The site is **read-only**: no accounts, comments or reader submissions.

## 2. Baseline for "after a solution"

All "what it would look like" content is built on a declared **reference model**:

1. **Guterres framework** (presented 30 June 2017, Crans-Montana). This is the primary basis.
2. **Convergences from the Anastasiades–Akıncı process (2015–2017)**.
3. **Downer document** (convergences compiled under UN Special Adviser Alexander Downer, from the Christofias–Talat period onwards). Used only where nothing newer covers a point. Verify the date and scope before writing.
4. **Annan Plan V (2004)** is used only for *comparison*, never as the reference model.

Every provision shown in the reference model links to the paragraph of the basis document it comes from, and shows its status.

## 3. Information architecture (page map)

```
/{lang}/                         Home: what this is, the explorer entry, latest updates
/{lang}/explore                  Interactive issue tree (+ plain list fallback)
/{lang}/issues/{slug}            Issue article (one per node of the tree)
/{lang}/positions/{issue-slug}   Position board for an issue (also embedded in the article)
/{lang}/compare                  Plan comparison matrix (issue × plan)
/{lang}/compare/{issue-slug}     One issue across all plans
/{lang}/timeline                 Full timeline, filterable by era, issue and actor
/{lang}/documents                Document library (filter by era, type, issue)
/{lang}/documents/{slug}         Document page: metadata, provenance, PDF, text, versions, backlinks
/{lang}/documents/{slug}/diff    Version diff (e.g. Annan I→V), phase 2
/{lang}/actors                   Actors index (parties, leaders, states, organisations)
/{lang}/actors/{slug}            An actor's positions across all issues, over time
/{lang}/after-a-solution         "What would it mean for me?" personas, phase 3
/{lang}/glossary                 Terms, including how each community names things
/{lang}/sources                  All sources (searchable)
/{lang}/about                    Who, why, the stance
/{lang}/methodology              Sourcing rules, status definitions, how positions are coded
/{lang}/corrections              Public corrections log
```

## 4. Issue tree (initial draft)

The tree is aligned with the UN negotiation chapters plus a "Foundations" branch. The slugs are stable IDs. This is a draft; the author adjusts it.

- **foundations**
  - bbf (what BBF means, and how it differs from unitary, confederal and two-state models)
  - federation
  - bizonality
  - bicommunality
  - political-equality (incl. UNSC Res. 716 definition)
  - single-sovereignty-citizenship-international-personality
  - basic-principles-of-a-solution (incl. 1977 & 1979 high-level agreements)
- **governance** (Governance & power-sharing)
  - federal-executive
    - rotating-presidency
    - cross-voting / weighted voting
  - federal-legislature (senate, house)
  - federal-judiciary (supreme court, deadlock resolution)
  - competences (federal vs constituent state)
  - federal-public-service-composition
  - federal-police
  - effective-participation / positive-vote
- **security-guarantees**
  - treaty-of-guarantee
  - treaty-of-alliance
  - foreign-troops
  - implementation-monitoring
  - army-demilitarisation
- **territory**
  - territorial-adjustment and maps
  - varosha
  - relocation-of-affected-persons
- **property**
  - heads-of-claim (reinstatement, exchange, compensation)
  - dispossessed-owner-vs-current-user
  - property-commission and financing
  - echr-case-law (Loizidou, Xenides-Arestis, Demopoulos and others)
- **citizenship-aliens-immigration**
  - citizenship (incl. Turkish nationals and settler-origin residents)
  - residency and internal-citizenship
  - equivalent-treatment-greek-turkish-nationals ("four freedoms")
- **freedoms**
  - three-basic-freedoms (movement, settlement, property) for Cypriots
  - transitional-arrangements
- **eu-matters**
  - acquis-and-derogations
  - protocol-10 and the green-line-regulation
  - representation-in-eu-institutions
  - tc-integration-into-eu
- **economy**
  - single-currency-central-bank
  - fiscal-federalism
  - economic-convergence and costs-of-solution
  - natural-resources-hydrocarbons
- **implementation**
  - referendums
  - transitional-period
  - deadlines-and-guarantees-of-implementation
- **related** (not negotiation chapters)
  - missing-persons (CMP)
  - confidence-building-measures
  - crossing-points

## 5. Content model

All structured content lives in the repo and is validated by Zod schemas in `src/content.config.ts` (Astro content collections). Localized fields use `{ en, el, tr? }` objects for structured data, and **per-locale MDX files** for long-form articles.

### Shared types

```ts
type Localized = { en: string; el?: string; tr?: string };
type Status =
  | "agreed"                 // formally agreed text
  | "converged"              // convergence recorded in the talks
  | "partially-converged"
  | "convergence-disputed"   // one side disputes that convergence exists
  | "divergent"
  | "proposal-only"          // in a UN or side proposal, not converged
  | "not-discussed";
type Certainty = "official" | "leader-statement" | "reported" | "inferred";
```

### Collections

```ts
// issues: src/content/issues/{lang}/{slug}.mdx  (frontmatter)
Issue {
  slug: string;                  // stable ID, same across locales
  title: string;
  summary: string;               // one line, used in the explorer and cards
  parent?: ref<Issue>;
  order: number;
  related: ref<Issue>[];
  status?: Status;               // overall state in the talks
  statusSources: ref<Source>[];  // required if status is set
  options?: IssueOption[];       // enables a position board for this issue
  lastReviewed: date;
  translationOf?: { lang: "en"; revision: string }; // for stale-translation checks
  draft: boolean;
}

IssueOption {
  id: string;                    // e.g. "rotation-2-1-cross-voting"
  label: Localized;
  description: Localized;
}

// actors: src/content/actors/{slug}.yaml
Actor {
  slug: string;
  name: Localized;
  shortName: Localized;          // "AKEL", "CTP"
  type: "community-leader" | "party" | "government" | "guarantor"
      | "international-org" | "person";
  community?: "gc" | "tc" | "maronite" | "armenian" | "latin" | "none";
  active: { from: date; to?: date };
  color?: string;                // secondary marker only, never the sole identifier
  logo?: string;                 // optional; check usage rights
}

// positions: src/content/positions/{issue-slug}.yaml (array per issue)
Position {
  actor: ref<Actor>;
  option: string;                // IssueOption.id, or "no-stated-position"
  certainty: Certainty;
  validFrom: date;
  validTo?: date;
  quote?: { original: string; lang: string; translation?: Localized };
  note?: Localized;              // nuance: "supports only with cross-voting"
  sources: ref<Source>[];        // min 1, enforced by schema
}

// documents: src/content/documents/{slug}/index.yaml (+ text.{lang}.md, files/)
Document {
  slug: string;
  title: Localized;
  originalTitle?: string;
  date: date;
  dateCertainty: "exact" | "month" | "year" | "approximate";
  type: "treaty" | "constitution" | "un-plan" | "un-report" | "unsc-resolution"
      | "high-level-agreement" | "joint-statement" | "set-of-ideas"
      | "leaked" | "court-judgment" | "eu-act" | "proposal" | "other";
  parties: ref<Actor>[];
  issues: ref<Issue>[];
  versions?: { id: string; label: string; date: date; file: string; text?: string }[];
  files: { lang: string; path: string; kind: "original" | "translation" | "scan" }[];
  provenance: Localized;         // where it comes from; for leaks, who published it first
  isLeaked: boolean;
  officialUrl?: string;
  archiveUrl?: string;
  copyrightNote?: string;
}

// sources: src/content/sources/{id}.yaml
Source {
  id: string;                    // e.g. "unsg-report-2017-09-28"
  title: string;
  author?: string;
  publisher: string;
  date: date;
  url?: string;
  archiveUrl?: string;           // Wayback snapshot, required when url is set (CI warns)
  type: "primary-official" | "primary-leaked" | "un" | "eu" | "court"
      | "news" | "academic" | "party-statement" | "interview" | "poll" | "other";
  lang: string;
  document?: ref<Document>;      // when the source is a document in the library
  accessed: date;
}

// events: src/content/events/{yyyy-mm-dd}-{slug}.yaml
Event {
  date: date;
  dateCertainty: "exact" | "month" | "year";
  endDate?: date;
  title: Localized;
  summary: Localized;
  era: EraId;
  importance: 1 | 2 | 3;         // controls zoom-level visibility
  issues: ref<Issue>[];
  actors: ref<Actor>[];
  documents: ref<Document>[];
  sources: ref<Source>[];
}

// provisions: src/content/provisions/{plan-slug}/{issue-slug}.yaml
Provision {
  plan: ref<Document>;           // Annan V, Guterres framework, Ghali Set of Ideas...
  issue: ref<Issue>;
  summary: Localized;
  anchors: string[];             // paragraph anchors in the document text (deep links)
  status: Status;                // its status in that process
  sources: ref<Source>[];
  isReferenceModel: boolean;     // part of the "after a solution" baseline
}

// glossary: src/content/glossary/{slug}.yaml
Term {
  slug: string;
  term: Localized;
  definition: Localized;
  usage?: { community: "gc" | "tc" | "international"; term: Localized; note?: Localized }[];
  sources: ref<Source>[];
}

// personas (phase 3): src/content/personas/{slug}.yaml
Persona {
  slug: string;
  title: Localized;              // "Displaced Greek Cypriot with property in the north"
  intro: Localized;
  steps: { question: Localized; provisions: ref<Provision>[]; explanation: Localized }[];
}
```

### Eras (timeline)

`pre-1955`, `1955-1960`, `1960-1963`, `1963-1974`, `1974-1977`, `1977-1990`, `1990-1999`, `1999-2004`, `2004-2008`, `2008-2013`, `2014-2017`, `2017-present`. Adjust as needed.

## 6. Document library: initial seed list

Verify every title, date and version before entering it. This list is a checklist, not data.

- **Pre-1960:** Radcliffe constitutional proposals (1956); Macmillan Plan (1958); Zurich & London Agreements (1959); Treaty of Establishment, Treaty of Guarantee, Treaty of Alliance (1960); 1960 Constitution.
- **1963–1974:** Makarios's 13 amendment proposals (1963); UNSC Res. 186 (1964); Acheson Plan(s) (1964); Galo Plaza report (1965); Geneva Declaration (1974); UNSC Res. 353 (1974).
- **1974–2004:** Makarios–Denktaş High-Level Agreement (1977); Kyprianou–Denktaş High-Level Agreement (1979); UNSC Res. 541 (1983), 550 (1984); Pérez de Cuéllar documents (1984–86; confirm titles, e.g. the "indicators"/draft framework agreement); UNSC Res. 649 (1990), 716 (1991), 750/774/789 (1992); Boutros-Ghali Set of Ideas (1992); Annan Plan I–V (2002–2004); 2004 referendum results.
- **EU:** Act of Accession 2003 – Protocol 10; Green Line Regulation (2004).
- **Courts:** ECtHR Loizidou v. Turkey; Xenides-Arestis v. Turkey; Demopoulos v. Turkey; Cyprus v. Turkey.
- **2004–2017:** 8 July 2006 agreement (Papadopoulos–Talat); 23 May 2008 joint statement (Christofias–Talat); Downer document; Joint Declaration of 11 February 2014 (Anastasiades–Eroğlu); 2015–2017 joint statements; Geneva conference documents (January 2017); Guterres framework (30 June 2017); UNSG reports on the good offices mission and on Crans-Montana.
- **2017–present:** informal meetings (Berlin 2019, Geneva 2021 and later 5+UN formats), UNSG good offices reports, UNSC UNFICYP renewal resolutions, and any newer convergence documents.

Document text is stored with **paragraph anchors** (`#art-3-para-2`, `#para-14`) so citations and provisions can deep-link to the exact paragraph.

## 7. Key interactive features

| Feature | Description | Phase |
|---|---|---|
| Citation system | `<Cite id="..." anchor="..."/>` inline, numbered footnotes, auto-generated "Sources" section per page, hover preview | 1 |
| Status badges | `<Status value="converged" sources={[...]}/>` with a link to the methodology definition | 1 |
| Analysis / Concern blocks | `<Analysis>`, `<Concern community="gc|tc">` (sourced), `<Claim>` (claim vs. what the documents say) | 1 |
| Timeline | Vertical, mobile-first, era bands, zoom by importance, filters (issue/actor/type), deep-linkable events | 1 (basic), 2 (filters/zoom) |
| Document library | List + filters, document page with PDF viewer + text with anchors + backlinks | 1 |
| Position board | Options × actors grid grouped by community/government; tooltip with quote, date, certainty, source; **time slider**; "no stated position" state; table fallback | 2 |
| Issue explorer | Zoomable tree of issues (React Flow or d3-hierarchy), status color plus icon; plain nested list fallback | 2 |
| Plan comparison | Issue × plan matrix; each cell shows provision summary, status and source anchor | 2 |
| Version diff | Side-by-side or inline diff between document versions (Annan I→V) | 2 |
| Search | Pagefind, multilingual (verify quality of Greek stemming) | 2 |
| After a solution | Persona walkthroughs built only on reference-model provisions, each step tagged with basis + status | 3 |
| Turkish locale | Full UI + content translation pipeline | 3 |
| Contributor CMS | Keystatic (Git-based, PR approval) **or** migration to headless CMS (Payload). Decide in phase 3 | 3 |

## 8. Tech stack

- **Astro** (static output) with **content collections** + **Zod** schemas.
- **MDX** for articles.
- **React** islands only for interactive components (timeline, explorer, position board, comparison matrix, diff, personas). Use `client:visible` where possible.
- **Tailwind CSS** (or CSS modules) with design tokens.
- **Pagefind** for search.
- **Cloudflare Pages** for hosting. **Cloudflare R2** for large PDFs if repo size becomes a problem.
- **Cloudflare Web Analytics** or Plausible: cookieless, so no consent banner.
- **CI (GitHub Actions):** `astro check`, schema validation, broken-link checker, citation lint (see below), build.
- **Scripts:**
  - `scripts/archive-source.ts`: submit a URL to the Wayback Machine and write `archiveUrl` into the source YAML.
  - `scripts/citation-lint.ts`: fail on unknown source IDs or anchors; warn on articles with no citations, sources missing `archiveUrl`, and positions or statuses without sources.
  - `scripts/translation-status.ts`: report missing or stale `el`/`tr` translations (by comparing `translationOf.revision` with the EN file's last commit).

## 9. Repository structure

```
/
├─ PLAN.md
├─ CLAUDE.md
├─ astro.config.mjs
├─ src/
│  ├─ content.config.ts          # all Zod schemas (source of truth)
│  ├─ content/
│  │  ├─ issues/{en,el,tr}/*.mdx
│  │  ├─ actors/*.yaml
│  │  ├─ positions/*.yaml
│  │  ├─ documents/{slug}/index.yaml, text.{lang}.md, files/*
│  │  ├─ sources/*.yaml
│  │  ├─ events/*.yaml
│  │  ├─ provisions/{plan}/*.yaml
│  │  ├─ glossary/*.yaml
│  │  └─ personas/*.yaml
│  ├─ components/
│  │  ├─ content/                # Cite, Status, Analysis, Concern, Claim, SourcesList
│  │  └─ islands/                # React: Timeline, Explorer, PositionBoard, CompareMatrix, Diff
│  ├─ i18n/{en,el,tr}.json       # UI strings
│  ├─ layouts/
│  ├─ lib/                       # data helpers: getIssueTree, getPositions(issue, date), ...
│  └─ pages/[lang]/...
├─ public/documents/             # PDFs (or R2)
└─ scripts/
```

## 10. Internationalisation

- Routes are prefixed: `/en/…`, `/el/…`, and later `/tr/…`. The root redirects based on `Accept-Language`, with an EN fallback.
- Articles: one MDX file per locale with the same slug. A missing locale renders the EN version with a visible "not yet translated" banner.
- Structured data uses `Localized` fields with the same fallback.
- There are no hardcoded UI strings; they all live in `src/i18n/*.json`.
- Fonts must have full Greek and Turkish glyph coverage (e.g. Noto Sans / Noto Serif, or another verified family).
- Quotes keep their **original language**, with a translation shown alongside.

## 11. Design principles

- **Calm and documentary.** No flags as decoration, no community color-coding that reads as "teams."
- Party colors are only a small secondary marker next to a text label. Nothing relies on color alone, and palettes are colorblind-safe.
- **Accessibility:** WCAG 2.2 AA. Every visualization has a semantic HTML table or list equivalent, and everything is keyboard-navigable.
- Mobile-first. Many readers will arrive from social media links on phones.
- Every page shows its last-reviewed date and links to its change history (the Git history on GitHub).
- Shareable deep links for issues, positions at a given date, timeline events and document paragraphs. Good OpenGraph images per issue.

## 12. Legal and safety notes

- UN documents, treaties and court judgments: host copies, with official links.
- Press articles: link and archive them; quote only short passages. Never rehost full articles.
- Leaked documents: record provenance (who published first, when), and only host documents that are already public. Add a contact/takedown address.
- No personal data is collected (read-only, cookieless analytics).
- Expect attention on high-salience days (plan publication, referendum). Static hosting plus a CDN covers traffic and DDoS. Keep the build reproducible so content can be republished elsewhere if needed.

## 13. Roadmap

### Phase 0: Scaffold
- Astro + React + MDX + Tailwind; `en`/`el` routing; i18n string files.
- All Zod schemas in `content.config.ts`, with 1–2 **clearly marked placeholder** entries per collection (`draft: true`, text `TODO(content)`).
- Content components: `Cite`, `SourcesList`, `Status`, `Analysis`, `Concern`, `Claim`.
- CI: check, build, citation lint, link check. Deploy previews on Cloudflare Pages.

**Done when:** a placeholder issue article renders in EN and EL, with numbered citations, an auto-generated sources section, a status badge and an analysis block, and CI is green.

### Phase 1: MVP (content-led)
- Foundations articles (BBF, bizonality, bicommunality, political equality) plus an overview article for each chapter.
- Document library with ~15 key documents, with text and anchors where available.
- Basic timeline (importance 1 and 2 events).
- Glossary, About, Methodology, Corrections pages.
- EN complete; EL for foundations and the core pages.

### Phase 2: Interactive layer
- Position boards (starting with rotating presidency, guarantees, troops, property heads of claim, territory, and the four freedoms).
- Issue explorer, plan comparison matrix, Annan version diff, Pagefind search, timeline filters and zoom, actor pages.

### Phase 3: After a solution + scale
- Persona walkthroughs on the reference model.
- Turkish locale.
- Contributor workflow decision and implementation.

## 14. Open decisions

- [ ] Site name and domain.
- [ ] Contributor model: Keystatic PR flow vs. headless CMS (decide before phase 3).
- [ ] House style for contested names (place names, institutions in the north, naming of 1974 events). Document it in `/methodology` and the glossary.
- [ ] Whether to show opinion-poll data on positions (separate from official positions, clearly labeled).
- [ ] Party logos: get permission or use text-only labels.
- [ ] PDF storage: repo vs. R2.