/**
 * Translation status (PLAN.md §8): report missing or stale `el`/`tr`
 * translations by comparing `translationOf.revision` with the EN file's last
 * commit.
 *
 * TODO: implement once per-locale issue files exist (plan steps C6–C7, C10).
 * Until then this checks nothing and says so.
 */
console.warn(
  "i18n:status: not implemented yet (needs src/content/issues/{en,el,tr}); nothing was checked.",
);
