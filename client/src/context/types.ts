import { AxiosInstance } from "axios";

export const SET_INTERACTIVE_PARAMS = "SET_INTERACTIVE_PARAMS";
export const SET_BACKEND_API = "SET_BACKEND_API";
export const SET_INIT = "SET_INIT";
export const SET_BREAKOUT = "SET_BREAKOUT";
export const RESET_BREAKOUT = "RESET_BREAKOUT";
export const SET_PARTICIPANT = "SET_PARTICIPANT";
export const SET_TIMER_AND_TIMEOUT = "SET_TIMER_AND_TIMEOUT";

export type InteractiveParams = {
  assetId: string;
  displayName: string;
  interactiveNonce: string;
  interactivePublicKey: string;
  profileId: string;
  sceneDropId: string;
  uniqueName: string;
  urlSlug: string;
  username: string;
  visitorId: string;
};

export type Participant = {
  profileId: string;
  username: string;
};

export interface InitialState {
  hasInteractiveParams: boolean;
  backendAPI: AxiosInstance | null;
  isAdmin: boolean | null;
  initLoading: boolean;
  startLoading: boolean;
  sessionData: {
    secondsPerRound: number;
    numOfRounds: number;
    participants: Participant[];
    startTime: number;
    status: string;
    timer: NodeJS.Timeout | null;
    timeout: NodeJS.Timeout | null;
  } | null;
}

export type ActionType = {
  type: string;
  payload?: any;
};
