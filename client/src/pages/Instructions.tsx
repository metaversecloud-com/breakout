import Header from "@/components/Header";
import React from "react";
import { Link } from "react-router-dom";

const Instructions = () => {
  return (
    <div className="flex flex-col w-full h-full">
      <Link to="/" className="p-1 border rounded-full hover:bg-[#f3f5f6] transition-colors self-start mb-2">
        <img src="left-arrow.svg" width={20} height={20} />
      </Link>
      <Header />
      <div className="flex flex-col">
        <h1 className="h3 !my-4 text-center">Instructions</h1>
        <ol className="list-decimal list-inside space-y-2">
          <li className="p1">
            Admins can configure and start a breakout session. Anyone who is in the breakout area at the start of a
            round will be included in the experience.
          </li>
          <li className="p1">
            The configurations are constrained to these values:
            <ul className="list-disc list-inside ml-4 space-y-2">
              <li className="p1">There should be a minimum of 2 participants.</li>
              <li className="p1">The number of rounds is capped at 25.</li>
              <li className="p1">
                The number of groups is capped at half the number of participants, with a maximum possible value of 16.
              </li>
              <li className="p1">The time per round should be at least 10 seconds and at most 10 minutes</li>
            </ul>
          </li>
          <li className="p1">
            The number of groups may be adjusted at the start of a round to account for the increase or decrease in the
            number of participants.
          </li>
          <li className="p1">
            The Admin who started the breakout session cannot leave the world while the session is in progress,
            otherwise it will be halted.
          </li>
        </ol>
      </div>
    </div>
  );
};

export default Instructions;
