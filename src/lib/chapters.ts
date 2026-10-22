import type { IssueNode } from "./issues";
import type { StatusValue } from "../components/content/status-glyphs";

// Icons for the top-level issues (the chapters in PLAN.md §4), from Lucide.
// Neutral pictograms only: no flags or maps of the island.
const chapterIcons: Record<string, string> = {
  foundations: "lucide:landmark",
  governance: "lucide:scale",
  "security-guarantees": "lucide:shield",
  territory: "lucide:map",
  property: "lucide:house",
  "citizenship-aliens-immigration": "lucide:id-card",
  freedoms: "lucide:route",
  "eu-matters": "lucide:globe",
  economy: "lucide:coins",
  implementation: "lucide:list-checks",
  related: "lucide:handshake",
};

export const iconFor = (slug: string) => chapterIcons[slug] ?? "lucide:circle-dot";

/** The node and all its descendants. */
export function descendants(node: IssueNode): IssueNode[] {
  return node.children.flatMap((c) => [c, ...descendants(c)]);
}

/** How many issues under a chapter have each status, in status order. */
export function statusCounts(node: IssueNode, order: StatusValue[]) {
  const all = descendants(node);
  return order
    .map((status) => ({ status, count: all.filter((n) => n.status === status).length }))
    .filter((s) => s.count > 0);
}
