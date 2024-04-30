import { GlobalDispatchContext, GlobalStateContext } from "@/context/GlobalContext";
import { setBreakoutConfig } from "@/context/actions";
import { InitialState, SET_BREAKOUT } from "@/context/types";
import React, { useContext, useState } from "react";

const Configure: React.FC = () => {
  const dispatch = useContext(GlobalDispatchContext);

  const { backendAPI } = useContext(GlobalStateContext) as InitialState;

  const [formData, setFormData] = useState({
    numOfGroups: 1,
    numOfRounds: 1,
    minutes: 0,
    seconds: 0,
    includeAdmins: false,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const [startLoading, setStartLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStartLoading(true);

    const { startTime } = await setBreakoutConfig(backendAPI!, formData);
    dispatch!({ type: SET_BREAKOUT, payload: { data: { ...formData, startTime, status: "active" } } });

    // console.log("Values", { minutes, seconds, numberOfRounds, numberOfGroups, includeAdmins });
    setStartLoading(false);
  };

  return (
    <>
      {/* <AdminControls /> */}
      <div className="flex flex-col w-full">
        <h4 className="h4 !my-8 !font-semibold text-center">Configure Breakout</h4>
        <div className="flex flex-col w-full">
          <form onSubmit={handleSubmit} className="flex flex-col w-full">
            <div className="flex items-center w-full my-2">
              <label className="flex items-center text-[#3b5166]" htmlFor="breakout-numOfGroups">
                Assign X participants into
                <input
                  id="breakout-numOfGroups"
                  type="number"
                  name="numOfGroups"
                  value={formData.numOfGroups}
                  onChange={handleInputChange}
                  min={1}
                  max={16}
                  className="border p-1 rounded-md text-center mx-1 w-16"
                />
                groups
              </label>
            </div>

            <div className="flex items-center w-full my-2">
              <label htmlFor="breakout-include-admin" className="flex items-center text-[#3b5166]">
                <input
                  id="breakout-include-admin"
                  className="mr-2"
                  name="includeAdmins"
                  type="checkbox"
                  checked={formData.includeAdmins}
                  onChange={handleInputChange}
                />
                Include Admins in groupings
              </label>
            </div>
            <div className="flex items-center w-full my-2">
              <label htmlFor="breakout-numOfRounds" className="flex items-center text-[#3b5166]">
                <input
                  id="breakout-numOfRounds"
                  type="number"
                  name="numOfRounds"
                  value={formData.numOfRounds}
                  className="border p-1 rounded-md text-center mr-1 w-16"
                  onChange={handleInputChange}
                />
                Rounds, each
              </label>
              <label htmlFor="breakout-minutes" className="flex items-center text-[#3b5166]">
                <input
                  id="breakout-minutes"
                  type="number"
                  name="minutes"
                  value={formData.minutes}
                  onChange={handleInputChange}
                  className="border p-1 rounded-md text-center mx-1 w-16"
                />{" "}
                min,
              </label>
            </div>
            <div className="flex items-center w-full">
              <label htmlFor="breakout-seconds" className="flex items-center text-[#3b5166]">
                {" "}
                <input
                  id="breakout-seconds"
                  type="number"
                  name="seconds"
                  value={formData.seconds}
                  onChange={handleInputChange}
                  className="border p-1 rounded-md text-center mr-1 w-16"
                />{" "}
                sec
              </label>
            </div>
            <button disabled={startLoading} type="submit" className="btn btn-enhanced mb-2 mt-8">
              {startLoading ? "Starting..." : "Start Breakout"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default Configure;
