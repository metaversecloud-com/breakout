import { Request, Response } from "express";
import { Credentials } from "../../types/index.js";
import { errorHandler } from "../../utils/index.js";
import { updateAdminCredentials } from "./handleSetBreakoutConfig.js";

export default async function handleEnterLandmarkZone(req: Request, res: Response) {
  try {
    const { assetId, interactivePublicKey, interactiveNonce, urlSlug, visitorId, sceneDropId, profileId } =
      req.body;
    const credentials = {
      assetId,
      interactivePublicKey,
      interactiveNonce,
      urlSlug,
      visitorId,
      sceneDropId,
      profileId,
    } as Credentials;
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
