import { GlobalStateContext } from "@/context/GlobalContext";
import { closeIframe } from "@/context/actions";
import { InitialState } from "@/context/types";
import React, { useContext, useEffect, useState } from "react";

const countdownInit = 20;

const Round: React.FC = () => {
  const { sessionData, backendAPI } = useContext(GlobalStateContext) as InitialState;
  const [isCountdownPeriod, setIsCountdownPeriod] = useState(false);

  const [isSessionStarted, setIsSessionStarted] = useState(false);

  const roundStartTimes = sessionData?.numOfRounds
    ? Array.from(
        { length: sessionData.numOfRounds + 1 },
        (_, i) => Math.floor(sessionData.startTime / 1000) + (sessionData.secondsPerRound + countdownInit) * i,
      )
    : [];

  const findRoundNum = () => {
    const now = Math.floor(Date.now() / 1000);
    return roundStartTimes.findIndex((time) => time > now);
  };

  const [roundNum, setRoundNum] = useState(findRoundNum());

  const [countdown, setCountdown] = useState(countdownInit);

  const calculateTimeLeft = () => {
    const now = Math.floor(Date.now() / 1000);
    const roundStartTime = roundStartTimes.find((time) => time > now);
    return roundStartTime ? roundStartTime - now : 0;
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    if (sessionData?.status === "active" && !isSessionStarted) {
      const timer = setInterval(() => {
        if (!sessionData) {
          return;
        }
        const timeLeft = calculateTimeLeft();

        if (timeLeft >= sessionData.secondsPerRound) {
          if (timeLeft === sessionData.secondsPerRound + countdownInit) {
            setRoundNum(findRoundNum());
          }
          setCountdown(timeLeft - sessionData.secondsPerRound);
          setIsCountdownPeriod(true);
        } else {
          setIsCountdownPeriod(false);
        }

        setTimeLeft(timeLeft);
      }, 1000);

      setTimeout(
        () => {         
          closeIframe(backendAPI!);
          clearInterval(timer);
        },

        (sessionData.secondsPerRound + countdownInit) * 1000 * sessionData.numOfRounds -
          (Date.now() - sessionData.startTime),
      );

      setIsSessionStarted(true);
    }
  }, [sessionData?.status]);

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
