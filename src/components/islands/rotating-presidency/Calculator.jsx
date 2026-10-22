import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import ResultsChart from "./ResultsChart.jsx";

const field =
  "block w-full mt-1 p-2 rounded-md border border-control bg-bg";
const percent = (n) => `${n.toFixed(1)}%`;

/**
 * Weighted cross-voting: a candidate's result is their share in their own
 * federated state, weighted (1 - w), plus their share in the other state,
 * weighted w.
 */
function weightedResult(mode, gcVote, tcVote, w) {
  return mode === "GC"
    ? gcVote * (1 - w) + tcVote * w
    : tcVote * (1 - w) + gcVote * w;
}

function Calculator({
  heading,
  strings,
  candidates,
  mode,
  crossVotingPercentage = 0.2,
  electionRound,
}) {
  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm();
  const [results, setResults] = useState([]);
  const slots = electionRound === 1 ? [1, 2, 3] : [1, 2];
  const selected = watch(slots.map((i) => `candidate${i}`));
  const nameOf = (value) =>
    candidates.find((c) => c.value === value)?.label ?? value;

  const onSubmit = (data) => {
    setResults(
      slots.map((i) => {
        const gcVote = parseFloat(data[`GCVote${i}`]);
        const tcVote = parseFloat(data[`TCVote${i}`]);
        return {
          candidate: nameOf(data[`candidate${i}`]),
          gcVote,
          tcVote,
          result: weightedResult(mode, gcVote, tcVote, crossVotingPercentage),
        };
      }),
    );
  };

  // A candidate can be chosen in one slot only.
  const available = (slot) =>
    candidates.filter(
      (c) =>
        !selected.some(
          (value, index) => index + 1 !== slot && value === c.value,
        ),
    );

  const id = (name) => `rp-${mode}-${name}`;

  return (
    <section aria-labelledby={id("heading")}>
      <h3 id={id("heading")} className="text-lg font-semibold">
        {heading}
      </h3>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mt-4 space-y-6"
        noValidate
      >
        <div
          className={`grid gap-4 ${slots.length === 3 ? "md:grid-cols-3" : "sm:grid-cols-2"}`}
        >
          {slots.map((i) => (
            <fieldset
              key={i}
              className="rounded-lg border border-rule p-4 space-y-3"
            >
              <legend className="px-1 font-medium">
                {strings.candidate.replace("{n}", i)}
              </legend>
              <Controller
                name={`candidate${i}`}
                control={control}
                defaultValue=""
                rules={{ required: true }}
                render={({ field: f }) => (
                  <label className="block text-sm">
                    <span className="sr-only">
                      {strings.candidate.replace("{n}", i)}
                    </span>
                    <select
                      {...f}
                      className={field}
                      aria-invalid={!!errors[`candidate${i}`]}
                    >
                      <option value="" disabled>
                        {strings.choose}
                      </option>
                      {available(i).map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
              />
              {errors[`candidate${i}`] && (
                <p className="text-sm">{strings.required}</p>
              )}
              {["GC", "TC"].map((state) => {
                const name = `${state}Vote${i}`;
                return (
                  <label key={state} className="block text-sm">
                    {state === "GC" ? strings.gcVote : strings.tcVote}
                    <input
                      className={field}
                      type="number"
                      min={0}
                      max={100}
                      step="any"
                      aria-invalid={!!errors[name]}
                      {...register(name, { required: true, min: 0, max: 100 })}
                    />
                    {errors[name] && (
                      <span className="block mt-1">{strings.percentRange}</span>
                    )}
                  </label>
                );
              })}
            </fieldset>
          ))}
        </div>
        <button
          type="submit"
          className="w-full py-3 rounded-lg border border-accent bg-accent text-on-accent font-semibold hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          {strings.calculate}
        </button>
      </form>

      {results.length > 0 && (
        <div className="mt-6" aria-live="polite">
          <ResultsChart data={results} />
          {/* The table is the accessible equivalent of the chart (CLAUDE.md). */}
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[28rem] text-sm text-left tabular-nums">
              <caption className="text-left font-semibold mb-2">
                {strings.results}
              </caption>
              <thead>
                <tr className="border-b border-rule">
                  <th scope="col" className="py-1 pr-2">
                    {strings.candidateColumn}
                  </th>
                  <th scope="col" className="py-1 pr-2">
                    {strings.gcVote}
                  </th>
                  <th scope="col" className="py-1 pr-2">
                    {strings.tcVote}
                  </th>
                  <th scope="col" className="py-1">
                    {strings.weighted}
                  </th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr
                    key={r.candidate}
                    className="border-b border-rule"
                  >
                    <th scope="row" className="py-1 pr-2 font-medium">
                      {r.candidate}
                    </th>
                    <td className="py-1 pr-2">{percent(r.gcVote)}</td>
                    <td className="py-1 pr-2">{percent(r.tcVote)}</td>
                    <td className="py-1 font-semibold">{percent(r.result)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}

export default Calculator;
