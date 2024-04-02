import React, { useEffect, useState } from "react";

const Round: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState(180);

  useEffect(() => {
    const timer = setInterval(() => {
      if (timeLeft > 0) {
        setTimeLeft(timeLeft - 1);
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
        <p className="p1 !font-semibold">Round 1 of 3</p>
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
