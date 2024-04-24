import { AxiosInstance } from "axios";

export const SET_INTERACTIVE_PARAMS = "SET_INTERACTIVE_PARAMS";
export const SET_BACKEND_API = "SET_BACKEND_API";
export const SET_INIT = "SET_INIT";

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

export interface InitialState {
  hasInteractiveParams: boolean;
  backendAPI: AxiosInstance | null;
  isAdmin: boolean | null;
  initLoading: boolean;
  startLoading: boolean;
  sessionData: {
    secondsPerRound: number;
    numOfRounds: number;
  } | null;
}

export type ActionType = {
  type: string;
  payload?: any;
};
