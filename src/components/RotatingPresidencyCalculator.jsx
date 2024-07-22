import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import Example from "./Example.tsx";

function RotatingPresidencyCalculator({
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

  const watchCandidates = watch(["candidate1", "candidate2", "candidate3"]);
  console.log("round=" + electionRound);
  useEffect(() => {
    console.log("Selected candidates changed:", watchCandidates);
  }, [watchCandidates]);

  const [chartVisibility, setChartVisibility] = useState(false);

  const onSubmit = (data) => {
    setChartVisibility(true);
    const formattedData =
      electionRound === 1
        ? [
            {
              candidate: data.candidate1,
              GCVote: parseFloat(data.GCVote1),
              TCVote: parseFloat(data.TCVote1),
              result:
                mode === "GC"
                  ? parseFloat(data.GCVote1) * (1 - crossVotingPercentage) +
                    parseFloat(data.TCVote1) * crossVotingPercentage
                  : parseFloat(data.TCVote1) * (1 - crossVotingPercentage) +
                    parseFloat(data.GCVote1) * crossVotingPercentage,
              image: `/content/rotating-presidency/${data.candidate1}.jpeg`,
            },
            {
              candidate: data.candidate2,
              GCVote: parseFloat(data.GCVote2),
              TCVote: parseFloat(data.TCVote2),
              result:
                mode === "GC"
                  ? parseFloat(data.GCVote2) * (1 - crossVotingPercentage) +
                    parseFloat(data.TCVote2) * crossVotingPercentage
                  : parseFloat(data.TCVote2) * (1 - crossVotingPercentage) +
                    parseFloat(data.GCVote2) * crossVotingPercentage,
              image: `/content/rotating-presidency/${data.candidate2}.jpg`,
            },
            {
              candidate: data.candidate3,
              GCVote: parseFloat(data.GCVote3),
              TCVote: parseFloat(data.TCVote3),
              result:
                mode === "GC"
                  ? parseFloat(data.GCVote3) * (1 - crossVotingPercentage) +
                    parseFloat(data.TCVote3) * crossVotingPercentage
                  : parseFloat(data.TCVote3) * (1 - crossVotingPercentage) +
                    parseFloat(data.GCVote3) * crossVotingPercentage,
              image: `/content/rotating-presidency/${data.candidate3}.jpg`,
            },
          ]
        : [
            {
              candidate: data.candidate1,
              GCVote: parseFloat(data.GCVote1),
              TCVote: parseFloat(data.TCVote1),
              result:
                mode === "GC"
                  ? parseFloat(data.GCVote1) * (1 - crossVotingPercentage) +
                    parseFloat(data.TCVote1) * crossVotingPercentage
                  : parseFloat(data.TCVote1) * (1 - crossVotingPercentage) +
                    parseFloat(data.GCVote1) * crossVotingPercentage,
              image: `/content/rotating-presidency/${data.candidate1}.jpeg`,
            },
            {
              candidate: data.candidate2,
              GCVote: parseFloat(data.GCVote2),
              TCVote: parseFloat(data.TCVote2),
              result:
                mode === "GC"
                  ? parseFloat(data.GCVote2) * (1 - crossVotingPercentage) +
                    parseFloat(data.TCVote2) * crossVotingPercentage
                  : parseFloat(data.TCVote2) * (1 - crossVotingPercentage) +
                    parseFloat(data.GCVote2) * crossVotingPercentage,
              image: `/content/rotating-presidency/${data.candidate2}.jpg`,
            },
          ];
    setResults(formattedData);

    console.log(formattedData[0].result);
  };

  const getFilteredCandidates = (currentIndex) => {
    const selected = watchCandidates.filter(
      (value, index) => index + 1 !== currentIndex,
    );
    return candidates.filter(
      (candidate) => !selected.includes(candidate.value),
    );
  };

  let electionRoundArray = electionRound === 1 ? [1, 2, 3] : [1, 2];

  return (
    <>
      <div className="max-w-4xl mx-auto p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <div className="flex md:mx-1 flex-wrap sm:flex-nowrap gap-1 md:gap-2">
            {electionRoundArray.map((i) => (
              <div
                key={i}
                className={`w-full md:px-s1 ${electionRound === 2 ? "w-full sm:w-1/2" : "md:w-1/3"}`}
              >
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <label className="block mb-2 text-lg font-medium text-gray-700">
                    Candidate {i}
                  </label>
                  <Controller
                    name={`candidate${i}`}
                    control={control}
                    defaultValue=""
                    rules={{ required: true }}
                    render={({ field }) => (
                      <select
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                        }}
                        className="block w-full mt-1 mb-4 p-2 border border-gray-300 rounded-md"
                      >
                        <option value="" disabled>
                          Choose Candidate
                        </option>
                        {getFilteredCandidates(i).map((candidate) => (
                          <option key={candidate.value} value={candidate.value}>
                            {candidate.label}
                          </option>
                        ))}
                      </select>
                    )}
                  />
                  {errors[`candidate${i}`] && (
                    <span className="text-red-600">This field is required</span>
                  )}

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700">
                      Percentage in the GC federated state
                    </label>
                    <input
                      className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                      type="number"
                      {...register(`GCVote${i}`, {
                        required: true,
                        min: 0,
                        max: 100,
                      })}
                    />
                    {errors[`GCVote${i}`] && (
                      <span className="text-red-600">
                        This field is required and should be between 0 and 100
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Percentage in the TC federated state
                    </label>
                    <input
                      className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                      type="number"
                      {...register(`TCVote${i}`, {
                        required: true,
                        min: 0,
                        max: 100,
                      })}
                    />
                    {errors[`TCVote${i}`] && (
                      <span className="text-red-600">
                        This field is required and should be between 0 and 100
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-opacity-50"
          >
            Submit
          </button>
        </form>
      </div>
      {chartVisibility && <Example data={results} />}
    </>
  );
}

export default RotatingPresidencyCalculator;
