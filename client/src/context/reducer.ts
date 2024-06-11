import {
  ActionType,
  InitialState,
  SET_BACKEND_API,
  SET_INTERACTIVE_PARAMS,
  SET_INIT,
  SET_BREAKOUT,
  RESET_BREAKOUT,
  SET_PARTICIPANT,
  SET_TIMER_AND_TIMEOUT,
} from "./types";

const globalReducer = (state: InitialState, action: ActionType) => {
  const { type, payload } = action;
  if (type === SET_INTERACTIVE_PARAMS) {
    return {
      ...state,
      ...payload,
      hasInteractiveParams: true,
    };
  } else if (type === SET_BACKEND_API) {
    return {
      ...state,
      backendAPI: payload.backendAPI,
    };
  } else if (type === SET_INIT) {
    if (
      payload.dataObject.startTime + (payload.dataObject.secondsPerRound + 10) * 1000 * payload.dataObject.numOfRounds <
      Date.now()
    ) {
      return {
        ...state,
        isAdmin: payload.isAdmin,
        initLoading: false,
        sessionData: {
          participants: payload.dataObject.participants,
          numOfRounds: 0,
          secondsPerRound: 0,
          startTime: 0,
          status: "waiting",
        },
      };
    } else {
      return {
        ...state,
        isAdmin: payload.isAdmin,
        initLoading: false,
        sessionData: {
          participants: payload.dataObject.participants,
          numOfRounds: parseInt(payload.dataObject.numOfRounds),
          secondsPerRound: parseInt(payload.dataObject.secondsPerRound),
          startTime: parseInt(payload.dataObject.startTime),
          status: payload.dataObject.status,
        },
      };
    }
  } else if (type === SET_BREAKOUT) {
    return {
      ...state,
      sessionData: {
        participants: payload.data.participants,
        numOfRounds: parseInt(payload.data.numOfRounds),
        secondsPerRound: parseInt(payload.data.minutes) * 60 + parseInt(payload.data.seconds),
        startTime: parseInt(payload.data.startTime),
        status: payload.data.status,
      },
    };
  } else if (type === RESET_BREAKOUT) {
    clearInterval(state.sessionData!.timer!);
    clearTimeout(state.sessionData!.timeout!);

    return {
      ...state,
      sessionData: {
        participants: [],
        numOfRounds: 0,
        secondsPerRound: 0,
        startTime: 0,
        status: "waiting",
        timer: null,
        timeout: null,
      },
    };
  } else if (type === SET_PARTICIPANT) {
    return {
      ...state,
      sessionData: {
        ...state.sessionData,
        participants: payload.participants,
      },
    };
  } else if (type === SET_TIMER_AND_TIMEOUT) {
    return {
      ...state,
      sessionData: {
        ...state.sessionData,
        timer: payload.timer,
        timeout: payload.timeout,
      },
    };
  } else {
    throw new Error(`Unhandled action type: ${type}`);
  }
};

export { globalReducer };
