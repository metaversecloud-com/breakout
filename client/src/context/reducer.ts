import { ActionType, InitialState, SET_BACKEND_API, SET_INTERACTIVE_PARAMS, SET_IS_ADMIN } from "./types";

const globalReducer = (state: InitialState, action: ActionType) => {
  const { type, payload } = action;
  switch (type) {
    case SET_INTERACTIVE_PARAMS:
      return {
        ...state,
        ...payload,
        hasInteractiveParams: true,
      };
    case SET_BACKEND_API:
      return {
        ...state,
        backendAPI: payload.backendAPI,
      };
    case SET_IS_ADMIN:
      return {
        ...state,
        isAdmin: payload.isAdmin,
      };
    default: {
      throw new Error(`Unhandled action type: ${type}`);
    }
  }
};

export { globalReducer };
