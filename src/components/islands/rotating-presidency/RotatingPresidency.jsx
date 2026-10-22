import Calculator from "./Calculator.jsx";
import OptionBar from "./OptionBar.jsx";
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

// Interactive part of the rotating-presidency article: two weighted
// cross-voting calculators (GC and TC candidates). `strings` are the UI texts,
// translated server-side by RotatingPresidencyTool.astro.
function RotatingPresidency({ strings }) {
  const [crossVotingPercentage, setCrossVotingPercentage] = useState(0.2);
  const [electionRound, setElectionRound] = useState(1);
  return (
    <div className="not-prose font-sans space-y-10">
      <OptionBar
        strings={strings}
        onCrossVotingPercentage={setCrossVotingPercentage}
        onElectionRound={setElectionRound}
      />
      <Calculator
        heading={strings.gcCandidates}
        strings={strings}
        candidates={candidatesGC}
        mode="GC"
        crossVotingPercentage={crossVotingPercentage}
        electionRound={electionRound}
      />
      <Calculator
        heading={strings.tcCandidates}
        strings={strings}
        candidates={candidatesTC}
        mode="TC"
        crossVotingPercentage={crossVotingPercentage}
        electionRound={electionRound}
      />
    </div>
  );
}

export default RotatingPresidency;
