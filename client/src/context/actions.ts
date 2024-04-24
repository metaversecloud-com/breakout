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

const startBreakout = async (
  backendAPI: AxiosInstance,
  data: {
    secondsPerRound: number;
    numOfRounds: number;
  },
) => {
  try {
    const result = await backendAPI.post("/start", data);
    return result.data;
  } catch (error) {
    console.error(error);
    return null;
  }
};

export { checkIsAdmin, checkInteractiveCredentials, fetchDataObject, startBreakout };
