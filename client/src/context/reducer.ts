import { ActionType, InitialState, SET_BACKEND_API, SET_INTERACTIVE_PARAMS, SET_INIT, SET_BREAKOUT, RESET_BREAKOUT } from "./types";

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
    case SET_INIT:
      return {
        ...state,
        isAdmin: payload.isAdmin,
        initLoading: false,
        sessionData: {
          participants: parseInt(payload.dataObject.participants),
          numOfRounds: parseInt(payload.dataObject.numOfRounds),
          secondsPerRound: parseInt(payload.dataObject.secondsPerRound),
          startTime: parseInt(payload.dataObject.startTime),
          status: payload.dataObject.status,
        },
      };
    case SET_BREAKOUT:
      return {
        ...state,
        sessionData: {
          participants: parseInt(payload.data.participants),
          numOfRounds: parseInt(payload.data.numOfRounds),
          secondsPerRound: parseInt(payload.data.minutes) * 60 + parseInt(payload.data.seconds),
          startTime: parseInt(payload.data.startTime),
          status: payload.data.status,
        },
      };
    case RESET_BREAKOUT:
      return {
        ...state,
        sessionData: {
          participants: 0,
          numOfRounds: 0,
          secondsPerRound: 0,
          startTime: 0,
          status: "waiting",
        },
      };
    default: {
      throw new Error(`Unhandled action type: ${type}`);
    }
  }
};

export { globalReducer };
