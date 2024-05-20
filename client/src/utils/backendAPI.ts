import axios from 'axios';
import { InteractiveParams } from '../context/types';

const setupBackendAPI = async (interactiveParams: InteractiveParams) => {
  const backendAPI = axios.create({
    baseURL: `/api`,
    headers: {
      "Content-Type": "application/json",
    },
  });

  // Only do this if have interactive nonce.
  if (interactiveParams.assetId) {
    backendAPI.interceptors.request.use((config: any) => {
      if (!config?.params) config.params = {};
      config.params = { ...config.params };
      config.params["assetId"] = interactiveParams.assetId;
      config.params["displayName"] = interactiveParams.displayName;
      config.params["interactiveNonce"] = interactiveParams.interactiveNonce;
      config.params["interactivePublicKey"] = interactiveParams.interactivePublicKey;
      config.params["profileId"] = interactiveParams.profileId;
      config.params["sceneDropId"] = interactiveParams.sceneDropId;
      config.params["uniqueName"] = interactiveParams.uniqueName;
      config.params["urlSlug"] = interactiveParams.urlSlug;
      config.params["username"] = interactiveParams.username;
      config.params["visitorId"] = interactiveParams.visitorId;
      return config;
    });
  }

  return backendAPI;
};

export { setupBackendAPI };
