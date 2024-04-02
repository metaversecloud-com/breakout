import { AxiosInstance } from "axios";

export const SET_INTERACTIVE_PARAMS = "SET_INTERACTIVE_PARAMS";
export const SET_BACKEND_API = "SET_BACKEND_API";
export const SET_IS_ADMIN = "SET_IS_ADMIN";

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
}

export interface InitialState {
  hasInteractiveParams: boolean;
  backendAPI: AxiosInstance | null;
  isAdmin: boolean | undefined;
}

export type ActionType = {
  type: string;
  payload?: any;
};