/**
 * Citation lint (PLAN.md §8): fail on unknown source IDs or anchors; warn on
 * articles with no citations, sources missing `archiveUrl`, and positions or
 * statuses without sources.
 *
 * TODO: implement once the `sources` collection and `<Cite>` exist (plan steps
 * C6–C8, C10). Until then this checks nothing and says so.
 */
console.warn(
  "lint:citations: not implemented yet (needs the sources collection and <Cite>); nothing was checked.",
);
