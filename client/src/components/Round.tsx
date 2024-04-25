import { GlobalStateContext } from "@/context/GlobalContext";
import { InitialState } from "@/context/types";
import React, { useContext, useEffect, useState } from "react";

const Round: React.FC = () => {
  const { sessionData } = useContext(GlobalStateContext) as InitialState;
  const roundStartTimes = sessionData?.numOfRounds
    ? Array.from(
        { length: sessionData.numOfRounds },
        (_, i) => Math.floor(parseInt(sessionData.startTime) / 1000) + sessionData.secondsPerRound * i,
      )
    : [];
  const [roundNum, setRoundNum] = useState(() => {
    const now = Math.floor(Date.now() / 1000);
    return roundStartTimes.findIndex((time) => time > now);
  });

  const calculateTimeLeft = () => {
    const now = Math.floor(Date.now() / 1000);
    const roundStartTime = roundStartTimes.find((time) => time > now);
    return roundStartTime ? roundStartTime - now : 0;
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => {
      if (timeLeft > 0) {
        setTimeLeft(timeLeft - 1);
      } else {
        setRoundNum(roundNum + 1);
        setTimeLeft(calculateTimeLeft());
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col w-full items-center justify-center my-2">
      <div className="flex w-full justify-between my-[2px]">
        <p className="p1 !font-semibold">
          Round {roundNum} of {sessionData?.numOfRounds}
        </p>
        <p className="p1 !font-semibold">{formatTime(timeLeft)}</p>
      </div>
      <div className="flex w-full justify-between my-[2px]">
        <p className="p2">In progress</p>
        <p className="p2">Remaining</p>
      </div>
    </div>
  );
};

export default Round;
