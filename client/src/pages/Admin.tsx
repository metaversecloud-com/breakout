import AdminControls from "@/components/AdminControls";
import { GlobalStateContext } from "@/context/GlobalContext";
import { startBreakout } from "@/context/actions";
import { InitialState } from "@/context/types";
import React, { useContext } from "react";

const Admin: React.FC = () => {
  const { backendAPI } = useContext(GlobalStateContext) as InitialState;

  const [startLoading, setStartLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStartLoading(true);
    const minutes = parseInt((e.currentTarget[0] as HTMLInputElement).value);
    const seconds = parseInt((e.currentTarget[1] as HTMLInputElement).value);
    const numberOfRounds = parseInt((e.currentTarget[2] as HTMLInputElement).value);
    const numberOfGroups = parseInt((e.currentTarget[3] as HTMLInputElement).value);
    const includeAdmins = (e.currentTarget[4] as HTMLInputElement).checked;

    await startBreakout(backendAPI, { secondsPerRound: minutes * 60 + seconds, numOfRounds: numberOfRounds });
    console.log("Values", { minutes, seconds, numberOfRounds, numberOfGroups, includeAdmins });
    setStartLoading(false);
  };

  return (
    <>
      <AdminControls />
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
                <p className="p2">Number of groups</p>
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
            <div className="flex w-full my-2 justify-start items-center">
              <div className="flex items-center mr-2">
                <input id="breakout-include-admin" className="input input-checkbox" type="checkbox" />
              </div>
              <label htmlFor="breakout-include-admin" className="w-2/5">
                <p className="p2">Include Admins</p>
              </label>
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
