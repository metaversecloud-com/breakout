import { useReducer } from "react";
import { globalReducer } from "./reducer";
import { InitialState } from "./types";
import GlobalState from "./GlobalState";

const initialState: InitialState = {
  hasInteractiveParams: false,
  backendAPI: null,
  isAdmin: null,
  initLoading: true,
  startLoading: false,
  sessionData: null,
};

const GlobalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(globalReducer, initialState);

  return (
    <GlobalState initialState={state} dispatch={dispatch}>
      {children}
    </GlobalState>
  );
};

export default GlobalProvider;
