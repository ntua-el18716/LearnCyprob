import type { CollectionEntry } from "astro:content";

export type StatusValue = NonNullable<CollectionEntry<"issues">["data"]["status"]>;

// One glyph shape per status, so a status never depends on colour alone.
// Fill level reads left to right: agreed (full) → divergent (empty).
export const statusGlyphs: Record<StatusValue, string> = {
  agreed: '<circle cx="6" cy="6" r="5" fill="currentColor"/>',
  converged:
    '<circle cx="6" cy="6" r="5" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M6 1a5 5 0 1 1-5 5h5z" fill="currentColor"/>',
  "partially-converged":
    '<circle cx="6" cy="6" r="5" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M6 1a5 5 0 0 1 0 10z" fill="currentColor"/>',
  "convergence-disputed":
    '<circle cx="6" cy="6" r="5" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M6 1a5 5 0 0 1 0 10z" fill="currentColor"/><path d="M1.5 10.5l9-9" stroke="currentColor" stroke-width="1.5"/>',
  divergent: '<circle cx="6" cy="6" r="5" fill="none" stroke="currentColor" stroke-width="1.5"/>',
  "proposal-only":
    '<path d="M6 1l5 5-5 5-5-5z" fill="none" stroke="currentColor" stroke-width="1.5"/>',
  "not-discussed": '<path d="M2 6h8" stroke="currentColor" stroke-width="1.5"/>',
};
