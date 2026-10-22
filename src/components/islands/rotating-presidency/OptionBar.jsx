const field =
  "block w-full mt-1 p-2 rounded-md border border-control bg-bg";

function OptionBar({ strings, onCrossVotingPercentage, onElectionRound }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="block text-sm font-medium">
        {strings.round}
        <select
          className={field}
          defaultValue={1}
          onChange={(e) => onElectionRound(Number(e.target.value))}
        >
          <option value={1}>{strings.round1}</option>
          <option value={2}>{strings.round2}</option>
        </select>
      </label>
      <label className="block text-sm font-medium">
        {strings.crossVoting}
        <input
          className={field}
          type="number"
          min={0}
          max={20}
          defaultValue={20}
          onChange={(e) =>
            onCrossVotingPercentage(Number(e.target.value) / 100)
          }
        />
      </label>
    </div>
  );
}

export default OptionBar;
