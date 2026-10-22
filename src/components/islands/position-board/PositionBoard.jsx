import { useState } from "react";

// Options × actors grid for one issue. Server-rendered as a complete table (the
// no-JS version shows current positions); once hydrated, the slider shows
// positions at any date where something changed. Certainty is a shape plus a
// text label, never colour alone.

const certaintyGlyphs = {
  official: <rect x="1.5" y="1.5" width="9" height="9" fill="currentColor" />,
  "leader-statement": <circle cx="6" cy="6" r="5" fill="currentColor" />,
  reported: <circle cx="6" cy="6" r="4.25" fill="none" stroke="currentColor" strokeWidth="1.5" />,
  inferred: (
    <circle cx="6" cy="6" r="4.25" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2" />
  ),
};

const NO_STATED = "no-stated-position";
const link = "underline decoration-zinc-400 underline-offset-2";

const validAt = (p, date) => p.validFrom <= date && (!p.validTo || date < p.validTo);

function Glyph({ certainty }) {
  return (
    <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" className="inline-block shrink-0">
      {certaintyGlyphs[certainty]}
    </svg>
  );
}

function PositionDetails({ position, strings, dateLabels }) {
  const range = position.validTo
    ? strings.validRange.replace("{from}", dateLabels[position.validFrom]).replace("{to}", dateLabels[position.validTo])
    : strings.validFrom.replace("{date}", dateLabels[position.validFrom]);
  return (
    <details className="group">
      <summary className="inline-flex cursor-pointer items-center gap-1.5 rounded-sm text-sm focus-visible:outline-2 focus-visible:outline-offset-2">
        <Glyph certainty={position.certainty} />
        <span lang={strings.certainty[position.certainty].lang}>{strings.certainty[position.certainty].text}</span>
      </summary>
      <div className="mt-2 space-y-2 text-sm font-normal">
        {position.quote && (
          <blockquote className="border-l-2 border-zinc-400 pl-2">
            <p lang={position.quote.lang}>“{position.quote.original}”</p>
            {position.quote.translation && (
              <p lang={position.quote.translation.lang} className="text-zinc-600 dark:text-zinc-400">
                {position.quote.translation.text}
              </p>
            )}
          </blockquote>
        )}
        {position.note && <p lang={position.note.lang}>{position.note.text}</p>}
        <p className="text-zinc-600 dark:text-zinc-400">{range}</p>
        <p>
          {strings.sources}:{" "}
          {position.sources.map((s, i) => (
            <span key={i}>
              {i > 0 && "; "}
              {s.href ? (
                <a href={s.href} lang={s.lang} className={link}>
                  {s.title}
                </a>
              ) : (
                <span lang={s.lang}>{s.title}</span>
              )}
            </span>
          ))}
        </p>
      </div>
    </details>
  );
}

export default function PositionBoard({ data, strings, dateLabels, today }) {
  // Slider stops: every date where a position starts or ends, then today.
  const stops = data.dates.at(-1) && data.dates.at(-1) >= today ? data.dates : [...data.dates, today];
  const [index, setIndex] = useState(stops.length - 1);
  const date = stops[index];
  const current = data.positions.filter((p) => validAt(p, date));
  const columns = [...data.options.map((o) => o.id), NO_STATED];
  const groups = [...new Set(data.actors.map((a) => a.group))];
  const sliderId = `board-${data.issue.slug}-date`;

  return (
    <figure className="not-prose font-sans my-8">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <label htmlFor={sliderId} className="text-sm font-medium">
          {strings.slider}
        </label>
        <input
          id={sliderId}
          type="range"
          min={0}
          max={stops.length - 1}
          step={1}
          value={index}
          onChange={(e) => setIndex(Number(e.target.value))}
          aria-valuetext={dateLabels[date]}
          className="w-full max-w-xs accent-zinc-700 dark:accent-zinc-300"
          disabled={stops.length < 2}
        />
        <output htmlFor={sliderId} className="text-sm" aria-live="polite">
          {strings.asOf.replace("{date}", dateLabels[date])}
        </output>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[32rem] border-collapse text-left text-sm">
          <caption className="sr-only">
            {strings.caption.replace("{issue}", data.issue.title).replace("{date}", dateLabels[date])}
          </caption>
          <thead>
            <tr className="border-b border-zinc-400 dark:border-zinc-600">
              <th scope="col" className="py-2 pr-3 align-bottom">
                {strings.actor}
              </th>
              {data.options.map((o) => (
                <th key={o.id} scope="col" className="py-2 pr-3 align-bottom">
                  <span lang={o.label.lang}>{o.label.text}</span>
                  <span lang={o.description.lang} className="block font-normal text-zinc-600 dark:text-zinc-400">
                    {o.description.text}
                  </span>
                </th>
              ))}
              <th scope="col" className="py-2 align-bottom">
                {strings.noStated}
              </th>
            </tr>
          </thead>
          {groups.map((group) => (
            <tbody key={group}>
              <tr>
                <th scope="colgroup" colSpan={columns.length + 1} className="pt-4 pb-1 text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                  <span lang={strings.groups[group].lang}>{strings.groups[group].text}</span>
                </th>
              </tr>
              {data.actors
                .filter((a) => a.group === group)
                .map((actor) => {
                  const mine = current.filter((p) => p.actor === actor.id);
                  return (
                    <tr key={actor.id} className="border-t border-zinc-200 dark:border-zinc-800 align-top">
                      <th scope="row" className="py-2 pr-3 font-medium">
                        <span className="inline-flex items-center gap-1.5">
                          {actor.color && (
                            <span aria-hidden="true" className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: actor.color }} />
                          )}
                          <span lang={actor.name.lang}>{actor.name.text}</span>
                        </span>
                      </th>
                      {mine.length === 0 ? (
                        <td colSpan={columns.length} className="py-2 text-zinc-500 dark:text-zinc-400">
                          {strings.noRecord}
                        </td>
                      ) : (
                        columns.map((column) => (
                          <td key={column} className="py-2 pr-3">
                            {mine
                              .filter((p) => p.option === column)
                              .map((p) => (
                                <PositionDetails key={p.key} position={p} strings={strings} dateLabels={dateLabels} />
                              ))}
                          </td>
                        ))
                      )}
                    </tr>
                  );
                })}
            </tbody>
          ))}
        </table>
      </div>

      <figcaption className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-600 dark:text-zinc-400">
        {Object.keys(certaintyGlyphs).map((c) => (
          <span key={c} className="inline-flex items-center gap-1">
            <Glyph certainty={c} />
            <span lang={strings.certainty[c].lang}>{strings.certainty[c].text}</span>
          </span>
        ))}
      </figcaption>
    </figure>
  );
}
