import RotatingPresidencyCalculator from "./RotatingPresidencyCalculator.jsx";
import RotatingPresidencyOptionBar from "./RotatingPresidencyOptionBar.jsx";
import { useState } from "react";

const candidatesGC = [
  {
    value: "christodoulides",
    label: "Nicos Christodoulides",
  },
  {
    value: "demetriou",
    label: "Annita Demetriou",
  },
  {
    value: "charalampidou",
    label: "Eirini Charalampidou",
  },
  {
    value: "mavroyannis",
    label: "Andreas Mavroyannis",
  },
  {
    value: "demetriades",
    label: "Achilleas Demetriades",
  },
  {
    value: "christou",
    label: "Christos Christou",
  },
  {
    value: "papadopoulos",
    label: "Nicolas Papadopoulos",
  },
];

const candidatesTC = [
  {
    value: "tatar",
    label: "Ersin Tatar",
  },
  {
    value: "ozersay",
    label: "Kudret Özersay",
  },
  {
    value: "akinci",
    label: "Mustafa Akıncı",
  },
  {
    value: "harmanci",
    label: "Mehmet Harmancı",
  },
  {
    value: "denktas",
    label: "Serdar Denktaş",
  },
  {
    value: "nami",
    label: "Özdil Nami",
  },
  {
    value: "arikli",
    label: "Serhat Arıklı",
  },
];

function RotatingPresidency() {
  const [crossVotingPercentage, setCrossVotingPercentage] = useState(0.2);
  const [electionRound, setElectionRound] = useState(1);
  return (
    <div>
      <RotatingPresidencyOptionBar
        onCrossVotingPercentage={setCrossVotingPercentage}
        onElectionRound={setElectionRound}
      />

      <RotatingPresidencyCalculator
        candidates={candidatesGC}
        mode="GC"
        crossVotingPercentage={crossVotingPercentage}
        electionRound={electionRound}
      />

      <RotatingPresidencyCalculator
        candidates={candidatesTC}
        mode="TC"
        crossVotingPercentage={crossVotingPercentage}
        electionRound={electionRound}
      />
    </div>
  );
}

export default RotatingPresidency;
