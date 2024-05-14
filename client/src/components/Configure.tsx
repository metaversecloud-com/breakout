import { GlobalDispatchContext, GlobalStateContext } from "@/context/GlobalContext";
import { getParticipants, setBreakoutConfig } from "@/context/actions";
import { InitialState, SET_BREAKOUT, SET_PARTICIPANT } from "@/context/types";
import React, { useContext, useState } from "react";

const Configure: React.FC = () => {
  const dispatch = useContext(GlobalDispatchContext);

  const { backendAPI, sessionData } = useContext(GlobalStateContext) as InitialState;

  const [showModal, setShowModal] = useState(false);
  const [startLoading, setStartLoading] = useState(false);
  const [getParticipantsLoading, setGetParticipantsLoading] = useState(false);

  const [formData, setFormData] = useState({
    numOfGroups: 1,
    numOfRounds: 1,
    minutes: 0,
    seconds: 0,
    includeAdmins: true,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked } = e.target;
    setFormData({
      ...formData,
      [name]: name === "includeAdmins" ? checked : value,
    });
  };

  const handleConfirmation = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setShowModal(true);
  };

  const handleSubmit = async () => {
    setStartLoading(true);

    const res = await setBreakoutConfig(backendAPI!, formData);
    if (res) {
      const { startTime } = res;
      dispatch!({
        type: SET_BREAKOUT,
        payload: {
          data: {
            numOfGroups: formData.numOfGroups,
            numOfRounds: formData.numOfRounds,
            minutes: formData.minutes,
            seconds: formData.seconds,
            includeAdmins: formData.includeAdmins,
            startTime,
            status: "active",
          },
        },
      });
    }

    setStartLoading(false);
  };

  const handleGetParticipants = async () => {
    setGetParticipantsLoading(true);
    const participants = await getParticipants(backendAPI!);
    dispatch!({ type: SET_PARTICIPANT, payload: { participants } });
    setGetParticipantsLoading(false);
  };

  return (
    <>
      {/* <AdminControls /> */}
      <div className="flex flex-col w-full">
        <div className="flex w-full !my-8 items-center justify-between">
          <h4 className="h4 !font-semibold text-center">Configure Breakout</h4>
          <button disabled={getParticipantsLoading} className="btn btn-enhanced !w-fit" onClick={handleGetParticipants}>
            {getParticipantsLoading ? "Loading..." : "Refresh"}
          </button>
        </div>
        <div className="flex flex-col w-full">
          <form onSubmit={handleConfirmation} className="flex flex-col w-full">
            <div className="flex items-center w-full my-2">
              <label className="flex items-center text-[#3b5166]" htmlFor="breakout-numOfGroups">
                Assign {sessionData?.participants.length} participants into
                <input
                  id="breakout-numOfGroups"
                  type="number"
                  name="numOfGroups"
                  value={formData.numOfGroups}
                  onChange={handleInputChange}
                  min={1}
                  max={sessionData?.participants.length}
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
            <button type="submit" className="btn btn-enhanced mb-2 mt-8">
              Start Breakout
            </button>
          </form>
        </div>
      </div>

      {showModal && (
        <div className="modal-container visible">
          <div className="modal">
            <h4 className="h4 capitalize">Confirmation</h4>
            <p className="p2">Are you sure you want to confirm these configurations?</p>

            <div className="flex flex-col items-start justify-center">
              <p className="p2">
                <span className="font-semibold">Number of Participants:</span> {sessionData?.participants.length}
              </p>
              <p className="p2">
                <span className="font-semibold">Number of Groups:</span> {formData.numOfGroups}
              </p>
              <p className="p2">
                <span className="font-semibold">Number of Rounds:</span> {formData.numOfRounds}
              </p>
              <p className="p2">
                <span className="font-semibold">Time per Round:</span> {formData.minutes} min {formData.seconds} sec
              </p>
              <p className="p2">
                <span className="font-semibold">Include Admins:</span> {formData.includeAdmins ? "Yes" : "No"}
              </p>
            </div>
            <div className="actions">
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>
                Close
              </button>
              <button className="btn btn-danger-outline" onClick={handleSubmit} disabled={startLoading}>
                {startLoading ? "Starting..." : "Yes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Configure;
