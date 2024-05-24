import { useCallback, useContext, useEffect, useMemo } from "react";
import { Route, Routes, useNavigate, useSearchParams } from "react-router-dom";

// pages
import Home from "@pages/Home";
import Error from "@pages/Error";

// context
import { GlobalDispatchContext, GlobalStateContext } from "./context/GlobalContext";
import { InitialState, InteractiveParams, SET_BACKEND_API, SET_INTERACTIVE_PARAMS, SET_INIT } from "./context/types";

// utils
import { setupBackendAPI } from "./utils/backendAPI";
import { checkInteractiveCredentials, checkIsAdmin, fetchDataObject } from "./context/actions";
import Instructions from "./pages/Instructions";

const App = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const { backendAPI } = useContext(GlobalStateContext) as InitialState;

  const dispatch = useContext(GlobalDispatchContext);

  const interactiveParams: InteractiveParams = useMemo(() => {
    return {
      assetId: searchParams.get("assetId") || "",
      displayName: searchParams.get("displayName") || "",
      interactiveNonce: searchParams.get("interactiveNonce") || "",
      interactivePublicKey: searchParams.get("interactivePublicKey") || "",
      profileId: searchParams.get("profileId") || "",
      sceneDropId: searchParams.get("sceneDropId") || "",
      uniqueName: searchParams.get("uniqueName") || "",
      urlSlug: searchParams.get("urlSlug") || "",
      username: searchParams.get("username") || "",
      visitorId: searchParams.get("visitorId") || "",
    };
  }, [searchParams]);

  const setInteractiveParams = useCallback(
    ({
      assetId,
      displayName,
      interactiveNonce,
      interactivePublicKey,
      profileId,
      sceneDropId,
      uniqueName,
      urlSlug,
      username,
      visitorId,
    }: InteractiveParams) => {
      const isInteractiveIframe = visitorId && interactiveNonce && interactivePublicKey && assetId;
      dispatch!({
        type: SET_INTERACTIVE_PARAMS,
        payload: {
          assetId,
          displayName,
          interactiveNonce,
          interactivePublicKey,
          isInteractiveIframe,
          profileId,
          sceneDropId,
          uniqueName,
          urlSlug,
          username,
          visitorId,
        },
      });
    },
    [dispatch],
  );

  useEffect(() => {
    if (interactiveParams.assetId) {
      setInteractiveParams({
        ...interactiveParams,
      });
    }
  }, [interactiveParams, setInteractiveParams]);

  const setupBackend = useCallback(async () => {
    const backendAPI = await setupBackendAPI(interactiveParams);

    dispatch!({ type: SET_BACKEND_API, payload: { backendAPI } });
  }, [dispatch, interactiveParams]);

  useEffect(() => {
    if (!backendAPI) {
      setupBackend();
    }
  }, [backendAPI, setupBackend]);

  useEffect(() => {
    const initialLoad = () => {
      if (backendAPI) {
        Promise.all([
          checkInteractiveCredentials(backendAPI),
          checkIsAdmin(backendAPI),
          fetchDataObject(backendAPI),
        ]).then(([result, admin, dataObject]) => {
          if (!result || !result.success || !dataObject) {
            navigate("*");
            return;
          }
          dispatch!({ type: SET_INIT, payload: { isAdmin: admin.isAdmin, dataObject } });
        });
      }
    };
    initialLoad();
  }, [backendAPI, dispatch, navigate]);

  return (
    <div className="container p-6 flex flex-col items-center justify-center">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/instructions" element={<Instructions />} />
        <Route path="*" element={<Error />} />
      </Routes>
    </div>
  );
};

export default App;
