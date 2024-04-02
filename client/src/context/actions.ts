import { AxiosInstance } from "axios";

const checkIsAdmin = async (backendAPI: AxiosInstance) => {
  try {
    const result = await backendAPI.get("/is-admin");
    return result.data;
  } catch (error) {
    console.error(error);
  }
};

export { checkIsAdmin };
