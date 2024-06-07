import { useContext, useState } from "react";

// context
import { GlobalDispatchContext, GlobalStateContext } from "@/context/GlobalContext";
import Round from "@/components/Round";
import DottedLoader from "@/components/DottedLoader";
import Configure from "@/components/Configure";
import { endBreakout } from "@/context/actions";
import { RESET_BREAKOUT, SET_INIT } from "@/context/types";
import Header from "@/components/Header";

const Home: React.FC = () => {
  const dispatch = useContext(GlobalDispatchContext);

  const { hasInteractiveParams, isAdmin, backendAPI, initLoading, sessionData } = useContext(GlobalStateContext);

  const [endLoading, setEndLoading] = useState(false);

  const handleEnd = async () => {
    setEndLoading(true);
    const res = await endBreakout(backendAPI!);
    if (res && res.success) {
      dispatch!({ type: RESET_BREAKOUT });
      dispatch!({ type: SET_INIT, payload: { isAdmin, dataObject: res.dataObject } });
    }
    setEndLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-start w-full h-full">
      {initLoading ? (
        <DottedLoader />
      ) : (
        <>
          <Header />
          {sessionData?.status === "waiting" ? (
            isAdmin ? (
              <div className="w-full">
                <Configure />
              </div>
            ) : (
              <div className="w-full">
                <p className="p2 !my-4">Waiting for admin to configure breakout...</p>
              </div>
            )
          ) : (
            <div className="w-full flex flex-col">
              <div className="my-12 w-full">
                <Round />
              </div>
              {isAdmin && (
                <div className="w-full h-14 bottom-0 left-0 fixed flex justify-center items-start bg-white">
                  <button onClick={handleEnd} disabled={endLoading} type="button" className="btn btn-enhanced !w-72">
                    {endLoading ? "Ending..." : "End"}
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Home;
