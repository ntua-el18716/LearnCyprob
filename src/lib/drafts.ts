// Draft entries (placeholders, work in progress) are built with a visible
// "Draft" banner and noindex while the site runs locally. Set
// PUBLIC_SHOW_DRAFTS=false before publishing to leave them out entirely.
export const showDrafts = import.meta.env.PUBLIC_SHOW_DRAFTS !== "false";

export function isVisible(entry: { data: { draft: boolean } }) {
  return showDrafts || !entry.data.draft;
}
