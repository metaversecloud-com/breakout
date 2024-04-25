import { AxiosInstance } from "axios";

const checkIsAdmin = async (backendAPI: AxiosInstance) => {
  try {
    const result = await backendAPI.get("/is-admin");
    return result.data;
  } catch (error) {
    console.error(error);
  }
};

const checkInteractiveCredentials = async (backendAPI: AxiosInstance) => {
  try {
    const result = await backendAPI.get("/system/interactive-credentials");
    return result.data;
  } catch (error) {
    console.error(error);
    return null;
  }
};

const fetchDataObject = async (backendAPI: AxiosInstance) => {
  try {
    const result = await backendAPI.get("/data-object");
    return result.data;
  } catch (error) {
    console.error(error);
    return null;
  }
};

const setBreakoutConfig = async (
  backendAPI: AxiosInstance,
  data: {
    numOfGroups: number;
    numOfRounds: number;
    minutes: number;
    seconds: number;
    includeAdmins: boolean;
  },
) => {
  try {
    const result = await backendAPI.post("/set-config", data);
    return result.data;
  } catch (error) {
    console.error(error);
    return null;
  }
};

const endBreakout = async (backendAPI: AxiosInstance) => {
  try {
    const result = await backendAPI.post("/reset");
    return result.data;
  } catch (error) {
    console.error(error);
    return null;
  }
}

export { checkIsAdmin, checkInteractiveCredentials, fetchDataObject, setBreakoutConfig, endBreakout };
