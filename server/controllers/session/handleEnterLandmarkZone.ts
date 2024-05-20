import { Request, Response } from "express";
import { errorHandler, getCredentials } from "../../utils/index.js";
import { updateAdminCredentials } from "./handleSetBreakoutConfig.js";

export default async function handleEnterLandmarkZone(req: Request, res: Response) {
  try {
    const credentials = getCredentials(req.body);

    updateAdminCredentials(credentials);
    return res.status(200).send("Success");
  } catch (error: any) {
    return errorHandler({
      error,
      functionName: "handleEnterLandmarkZone",
      message: "Error with landmark zone webhook",
      req,
      res,
    });
  }
}
