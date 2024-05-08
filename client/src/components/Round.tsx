import { GlobalStateContext } from "@/context/GlobalContext";
import { InitialState } from "@/context/types";
import React, { useContext, useEffect, useState } from "react";

const Round: React.FC = () => {
  const { sessionData } = useContext(GlobalStateContext) as InitialState;
  const [isCountdownPeriod, setIsCountdownPeriod] = useState(false);

  const roundStartTimes = sessionData?.numOfRounds
    ? Array.from(
        { length: sessionData.numOfRounds + 1 },
        (_, i) => Math.floor(sessionData.startTime / 1000) + (sessionData.secondsPerRound + 10) * i,
      )
    : [];
  const [roundNum, setRoundNum] = useState(() => {
    const now = Math.floor(Date.now() / 1000);
    return roundStartTimes.findIndex((time) => time > now);
  });

  const [countdown, setCountdown] = useState(10);

  const calculateTimeLeft = () => {
    const now = Math.floor(Date.now() / 1000);
    const roundStartTime = roundStartTimes.find((time) => time > now);
    return roundStartTime ? roundStartTime - now : 0;
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    if (sessionData) {
      const timer = setInterval(() => {
        if (!sessionData) {
          return;
        }
        if (timeLeft > 1) {
          if (timeLeft >= sessionData.secondsPerRound) {
            setCountdown(timeLeft - sessionData.secondsPerRound);
            if (!isCountdownPeriod) {
              setIsCountdownPeriod(true);
            }
          } else {
            if (isCountdownPeriod) {
              setIsCountdownPeriod(false);
            }
          }
          setTimeLeft(timeLeft - 1);
        } else {
          if (roundNum < sessionData.numOfRounds) {
            if (timeLeft === 1) {
              setIsCountdownPeriod(true);
              setCountdown(10);
              setRoundNum(roundNum + 1);
            }
            setTimeLeft(calculateTimeLeft());
          }
        }
      }, 1000);

      const timeout = setTimeout(
        () => {
          console.log("CLEARING INTERVAL");
          clearInterval(timer);
        },
        sessionData.startTime + (sessionData.secondsPerRound + 10) * 1000 * sessionData.numOfRounds,
      );

      return () => {
        clearInterval(timer);
        clearTimeout(timeout);
      };
    }
  }, [timeLeft, sessionData]);

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col w-full items-center justify-center my-2">
      {isCountdownPeriod ? (
        <div className="fixed inset-0 backdrop-brightness-50 backdrop-blur-sm">
          <div className="flex w-full h-full items-center justify-center">
            <div className="flex flex-row items-center justify-center">
              <h2 className="h2 !font-bold !text-white px-6">The next round starts in {countdown}</h2>
            </div>
          </div>
        </div>
      ) : (
        <>
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
        </>
      )}
    </div>
  );
};

export default Round;
