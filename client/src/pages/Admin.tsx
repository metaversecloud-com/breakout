import React from "react";
import { Link, useLocation } from "react-router-dom";

const Admin: React.FC = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const timePerRound = (e.currentTarget[0] as HTMLInputElement).value;
    const numberOfRounds = (e.currentTarget[1] as HTMLInputElement).value;
    const numberOfPeople = (e.currentTarget[2] as HTMLInputElement).value;

    console.log({ timePerRound, numberOfRounds, numberOfPeople });
  }
  
  return (
    <>
      {currentPath !== "/" && (
        <Link
          to="/"
          className="border rounded-full flex self-start items-center justify-center p-1 hover:bg-[#f3f5f6] transition-colors !w-fit"
        >
          <i className="icon left-arrow-icon h-6 w-6" />
        </Link>
      )}
      <div className="flex flex-col w-full">
        <h3 className="h3 !my-4 !font-semibold text-center">Configure a Breakout</h3>
        <div className="flex flex-col w-full">
          <form onSubmit={handleSubmit} className="flex flex-col w-full">
            <div className="flex w-full my-2 justify-between items-center">
              <label htmlFor="breakout-time" className="w-2/5">
                <p className="p2">Time per round (minutes:seconds)</p>
              </label>
              <div className="flex items-center">
                <input type="number" id="breakout-time" required max={9} min={0} className="input !w-fit" />
                <span className="mx-[1px]">:</span>
                <input type="number" id="breakout-time" required max={59} min={1} className="input !w-fit" />
              </div>
            </div>
            <div className="flex w-full my-2 justify-between items-center">
              <label htmlFor="breakout-number-of-rounds" className="w-2/5">
                <p className="p2">Number of rounds</p>
              </label>
              <div className="flex items-center">
                <input
                  type="number"
                  id="breakout-number-of-rounds"
                  required
                  max={25}
                  min={1}
                  className="input !w-fit"
                />
              </div>
            </div>
            <div className="flex w-full my-2 justify-between items-center">
              <label htmlFor="breakout-number-of-people" className="w-2/5">
                <p className="p2">Number of people per group</p>
              </label>
              <div className="flex items-center">
                <input
                  type="number"
                  id="breakout-number-of-people"
                  required
                  max={25}
                  min={2}
                  className="input !w-fit"
                />
              </div>
            </div>
            <button type="submit" className="btn btn-enhanced my-2">
              Save
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default Admin;
