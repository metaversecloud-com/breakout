import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Route, Routes, useNavigate, useSearchParams } from "react-router-dom";

// pages
import Home from "@pages/Home";
import Error from "@pages/Error";

// context
import { GlobalDispatchContext, GlobalStateContext } from "./context/GlobalContext";
import {
  InitialState,
  InteractiveParams,
  SET_BACKEND_API,
  SET_INTERACTIVE_PARAMS,
  SET_IS_ADMIN,
} from "./context/types";

// utils
import { setupBackendAPI } from "./utils/backendAPI";
import { AxiosInstance } from "axios";
import { checkIsAdmin } from "./context/actions";
import Admin from "./pages/Admin";

const App = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [hasInitBackendAPI, setHasInitBackendAPI] = useState(false);

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

  const setBackendAPI = useCallback(
    (backendAPI: AxiosInstance) => {
      dispatch!({
        type: SET_BACKEND_API,
        payload: { backendAPI },
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

  useEffect(() => {
    const setupBackend = async () => {
      const setupResult = await setupBackendAPI(interactiveParams);

      if (!setupResult.success) {
        navigate("*");
      } else {
        setBackendAPI(setupResult.backendAPI as AxiosInstance);
        setHasInitBackendAPI(true);
      }
    };

    if (!hasInitBackendAPI) {
      setupBackend();
    }
  }, [hasInitBackendAPI, interactiveParams, navigate, setBackendAPI, setHasInitBackendAPI]);

  useEffect(() => {
    const adminCheck = async () => {
      if (backendAPI) {
        const { isAdmin } = await checkIsAdmin(backendAPI);
        dispatch!({ type: SET_IS_ADMIN, payload: { isAdmin } });
      }
    };
    adminCheck();
  }, [backendAPI, dispatch]);
  return (
    <div className="container p-6 flex flex-col items-center justify-center">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="*" element={<Error />} />
      </Routes>
    </div>
  );
};

export default App;
