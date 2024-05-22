import { GlobalDispatchContext, GlobalStateContext } from "@/context/GlobalContext";
import { getParticipants, setBreakoutConfig } from "@/context/actions";
import { InitialState, SET_BREAKOUT, SET_PARTICIPANT } from "@/context/types";
import React, { useContext, useState } from "react";
import { Tooltip } from "react-tooltip";

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
    if (participants) {
      dispatch!({ type: SET_PARTICIPANT, payload: { participants } });
    }
    setGetParticipantsLoading(false);
  };

  return (
    <>
      {/* <AdminControls /> */}
      <div className="flex flex-col w-full">
        <div className="flex w-full !my-6 items-center justify-between">
          <h4 className="h4 !font-semibold text-center">Configure Breakout</h4>
        </div>
        <div className="flex flex-col w-full">
          <h2 className="h5">Groups</h2>
          <div className="flex flex-row w-full justify-between items-center">
            <p className="p1">{sessionData?.participants.length} Participants</p>
            <div className="flex flex-col items-center justify-start">
              <button
                data-tooltip-id="refresh"
                data-tooltip-content="Refresh Participant Count"
                disabled={getParticipantsLoading}
                className="btn btn-icon !p-0"
                onClick={handleGetParticipants}
              >
                <img src="/refresh.svg" alt="refresh" className="w-6 h-6" />
              </button>
            </div>
          </div>
          <form onSubmit={handleConfirmation} className="flex flex-col w-full">
            <div className="flex items-center w-full my-1">
              <label className="flex items-center text-[#3b5166]" htmlFor="breakout-numOfGroups">
                <input
                  id="breakout-numOfGroups"
                  type="number"
                  name="numOfGroups"
                  value={formData.numOfGroups}
                  onChange={handleInputChange}
                  min={1}
                  max={sessionData ? Math.min(sessionData?.participants.length, 16) : 16}
                  className="border rounded-md text-center !p-1"
                />
                <span className="p-1 mx-2">Groups</span>
              </label>
            </div>

            <div className="flex items-center w-full my-2">
              <label htmlFor="breakout-include-admin" className="flex items-center text-[#3b5166]">
                <input
                  id="breakout-include-admin"
                  className="input input-checkbox !p-2 !rounded-none"
                  name="includeAdmins"
                  type="checkbox"
                  checked={formData.includeAdmins}
                  onChange={handleInputChange}
                />
                <span className="mx-2">Include Admins in groupings</span>
              </label>
            </div>
            <div className="flex flex-col items-start w-full mb-2 mt-6">
              <h2 className="h5 !mb-2">Rounds</h2>
              <label htmlFor="breakout-numOfRounds" className="flex items-center text-[#3b5166]">
                <input
                  id="breakout-numOfRounds"
                  type="number"
                  name="numOfRounds"
                  min={1}
                  max={25}
                  value={formData.numOfRounds}
                  className="border rounded-md text-center !p-1"
                  onChange={handleInputChange}
                />
                <span className="mx-2">Rounds, each</span>
              </label>
            </div>
            <div className="flex items-center w-full">
              <label htmlFor="breakout-minutes" className="flex items-center text-[#3b5166]">
                <input
                  id="breakout-minutes"
                  type="number"
                  name="minutes"
                  value={formData.minutes}
                  min={0}
                  max={10}
                  onChange={handleInputChange}
                  className="border !p-1 rounded-md text-center mr-1"
                />
                <span className="ml-1 mr-2">min</span>
              </label>
              <label htmlFor="breakout-seconds" className="flex items-center text-[#3b5166]">
                <input
                  id="breakout-seconds"
                  type="number"
                  name="seconds"
                  value={formData.seconds}
                  min={0}
                  max={59}
                  onChange={handleInputChange}
                  className="border !p-1 rounded-md text-center mr-1"
                />
                <span className="ml-1">sec</span>
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
                <span className={`font-semibold ${sessionData?.participants.length === 1 ? "text-red-500" : ""}`}>
                  Number of Participants: {sessionData?.participants.length}
                </span>
              </p>
              <p className="p2">
                <span className="font-semibold">Number of Groups: {formData.numOfGroups}</span>
              </p>
              <p className="p2">
                <span className="font-semibold">Number of Rounds: {formData.numOfRounds}</span>
              </p>
              <p className="p2">
                <span
                  className={`font-semibold ${60 * parseInt(formData.minutes) + parseInt(formData.seconds) > 600 || 60 * parseInt(formData.minutes) + parseInt(formData.seconds) < 10 ? "text-red-500" : ""}`}
                >
                  Time per Round: {formData.minutes} min {formData.seconds} sec
                </span>
              </p>
              <p className="p2">
                <span className="font-semibold">Include Admins: {formData.includeAdmins ? "Yes" : "No"}</span>
              </p>
            </div>
            <div className="actions">
              <button className="btn btn-danger-outline" onClick={() => setShowModal(false)}>
                No
              </button>
              <button className={`btn btn-success-outline ${startLoading ? 'hover:!text-[#d6dbdf] hover:!border-[#d6dbdf]' : ''}`} onClick={handleSubmit} disabled={startLoading}>
                {startLoading ? "Starting..." : "Yes"}
              </button>
            </div>
          </div>
        </div>
      )}
      <Tooltip id="refresh" className="!bg-[#0a2540] text-white" />
    </>
  );
};

export default Configure;
