import { useForm } from "react-hook-form";

function RotatingPresidencyOptionBar({
  onCrossVotingPercentage,
  onElectionRound,
}) {
  const {
    register,
    formState: { errors },
  } = useForm({
    electionRound: 1,
    crossVotingPercentage: 20,
    singleTicket: false,
  });

  return (
    <form className="flex flex-row ">
      <select
        {...register("electionRound", { required: false })}
        className="mt-1 block w-1/4 p-2 border border-gray-300 rounded-md"
        onChange={(e) => onElectionRound(Number(e.target.value))}
      >
        <option value={1}>Round 1</option>
        <option value={2}>Round 2</option>
      </select>

      <div className="mt-1 block w-1/2 p-2 border border-gray-300 rounded-md">
        <div className="flex flex-row items-center justify-center gap-3">
          <label className="block text-sm font-medium text-gray-700">
            Weighted cross-voting contribution:
          </label>
          <input
            className="mt-1 block w-1/4 p-2 border border-gray-300 rounded-md"
            type="number"
            {...register(`crossVotingPercentage`, {
              required: true,
              min: 0,
              max: 20,
            })}
            onChange={(e) =>
              onCrossVotingPercentage(Number(e.target.value) / 100)
            }
          />
        </div>
      </div>
      <div className="mt-1 w-1/4 p-2 border border-gray-300 rounded-md flex flex-row items-center justify-center">
        <label className="block text-sm font-medium text-gray-700">
          Single Ticket:
        </label>
        <input
          className="mt-1 block w-1/3 p-2 border border-gray-300 rounded-md"
          type="checkbox"
          {...register(`crossVotingPercentage`, {
            required: true,
          })}
        />
      </div>
    </form>
  );
}

export default RotatingPresidencyOptionBar;
