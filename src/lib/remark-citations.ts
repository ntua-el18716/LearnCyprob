import type { Root } from "mdast";
import type { MdxJsxAttribute, MdxJsxFlowElement, MdxJsxTextElement } from "mdast-util-mdx-jsx";
import type { VFile } from "vfile";
import { visit } from "unist-util-visit";

/**
 * Numbers citations at compile time, in reading order, so numbering never
 * depends on render order.
 *
 * - `<Cite id="src" anchor="para-12" />` gets `n` (the source's number) and
 *   `ref` (a unique back-link id for this use).
 * - `<Status>`, `<Concern>` and `<Claim>` with `sources={["a", "b"]}` get
 *   `numbers="1,2"` and `refs="…"` the same way.
 * - An issue's frontmatter `statusSources` are numbered first (the status
 *   badge sits in the page header); their numbers go to frontmatter
 *   `statusCitation` as `{ numbers, refs }`.
 * - Frontmatter `citations` lists each source once, in order of first use,
 *   with every use (back-link id and anchor); the article layout passes it
 *   to `<SourcesList>`.
 *
 * Unknown source ids are caught when the components look them up.
 */
const SOURCED = new Set(["Status", "Concern", "Claim"]);

type JsxNode = MdxJsxFlowElement | MdxJsxTextElement;

export type Citation = { id: string; uses: { ref: string; anchor?: string }[] };

export function remarkCitations() {
  return function (tree: Root, file: VFile) {
    const citations: Citation[] = [];

    const number = (id: string, anchor?: string) => {
      let citation = citations.find((c) => c.id === id);
      if (!citation) citations.push((citation = { id, uses: [] }));
      const n = citations.indexOf(citation) + 1;
      const ref = `cite-ref-${n}-${citation.uses.length + 1}`;
      citation.uses.push(anchor ? { ref, anchor } : { ref });
      return { n, ref };
    };

    const astro = (file.data.astro ??= {}) as { frontmatter?: Record<string, unknown> };
    const statusSources = astro.frontmatter?.statusSources;
    if (Array.isArray(statusSources) && statusSources.length > 0) {
      const cited = statusSources.map((id) => number(String(id)));
      astro.frontmatter = {
        ...astro.frontmatter,
        statusCitation: {
          numbers: cited.map((c) => c.n).join(","),
          refs: cited.map((c) => c.ref).join(","),
        },
      };
    }

    visit(tree, (node) => {
      if (node.type !== "mdxJsxFlowElement" && node.type !== "mdxJsxTextElement") return;
      const el = node;
      if (el.name === "Cite") {
        const id = stringAttr(el, "id");
        if (!id) throw fail(file, el, '<Cite> needs a string id, e.g. <Cite id="source-id" />');
        const { n, ref } = number(id, stringAttr(el, "anchor"));
        setAttr(el, "n", String(n));
        setAttr(el, "ref", ref);
      } else if (el.name && SOURCED.has(el.name)) {
        const cited = arrayAttr(file, el, "sources").map((id) => number(id));
        setAttr(el, "numbers", cited.map((c) => c.n).join(","));
        setAttr(el, "refs", cited.map((c) => c.ref).join(","));
      }
    });

    astro.frontmatter = { ...astro.frontmatter, citations };
  };
}

function findAttr(el: JsxNode, name: string) {
  return el.attributes.find(
    (a): a is MdxJsxAttribute => a.type === "mdxJsxAttribute" && a.name === name,
  );
}

function stringAttr(el: JsxNode, name: string) {
  const value = findAttr(el, name)?.value;
  return typeof value === "string" ? value : undefined;
}

// Reads `sources={["a", "b"]}` (string literals only).
function arrayAttr(file: VFile, el: JsxNode, name: string): string[] {
  const attr = findAttr(el, name);
  if (!attr) return [];
  const value = attr.value;
  const program = typeof value === "object" && value ? value.data?.estree : undefined;
  const statement = program?.body[0];
  const expr = statement?.type === "ExpressionStatement" ? statement.expression : undefined;
  if (
    expr?.type !== "ArrayExpression" ||
    !expr.elements.every((e) => e?.type === "Literal" && typeof e.value === "string")
  ) {
    throw fail(
      file,
      el,
      `<${el.name}> ${name} must be an array of source ids, e.g. ${name}={["source-id"]}`,
    );
  }
  return expr.elements.map((e) => (e as { value: string }).value);
}

function setAttr(el: JsxNode, name: string, value: string) {
  const existing = findAttr(el, name);
  if (existing) existing.value = value;
  else el.attributes.push({ type: "mdxJsxAttribute", name, value });
}

function fail(file: VFile, el: JsxNode, message: string) {
  const line = el.position?.start.line;
  return new Error(`${file.path}${line ? `:${line}` : ""}: ${message}`);
}
