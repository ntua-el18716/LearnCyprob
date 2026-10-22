// Timeline eras (PLAN.md §5), in order. The schema validates against this list
// and the timeline draws it, so the two can't drift apart.
export const eras = [
  "pre-1955",
  "1955-1960",
  "1960-1963",
  "1963-1974",
  "1974-1977",
  "1977-1990",
  "1990-1999",
  "1999-2004",
  "2004-2008",
  "2008-2013",
  "2014-2017",
  "2017-present",
] as const;
export type Era = (typeof eras)[number];

/**
 * An era's span in years. Open ends use `earliest` (for "pre-…") and `now`
 * (for "…-present").
 */
export function eraSpan(era: Era, earliest: number, now: number) {
  const [from, to] = era.split("-");
  return {
    start: from === "pre" ? Math.min(earliest, Number(to) - 5) : Number(from),
    end: to === "present" ? now : Number(to),
  };
}
