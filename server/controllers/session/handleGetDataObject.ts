import { Credentials } from "../../types/index.js";
import { WorldActivity, errorHandler, getDroppedAsset } from "../../utils/index.js";
import { Request, Response } from "express";

export default async function handleGetDataObject(req: Request, res: Response) {
  try {
    const { assetId, interactivePublicKey, interactiveNonce, urlSlug, visitorId, sceneDropId } =
      req.query as unknown as Credentials;
    const credentials = {
      assetId,
      interactivePublicKey,
      interactiveNonce,
      urlSlug,
      visitorId,
      sceneDropId,
    } as Credentials;

    const keyAsset = await getDroppedAsset(credentials);
    if (keyAsset.error) {
      return res.status(404).json({ message: "Asset not found" });
    }
    
    const worldActivity = WorldActivity.create(urlSlug, {
      credentials: {
        interactiveNonce,
        interactivePublicKey,
        visitorId,
      },
    });

    const visitors = await worldActivity.fetchVisitorsInZone(keyAsset.dataObject.landmarkZoneId);
    const visitorProfileIds = Object.values(visitors).map((visitor) => visitor.profileId);

    keyAsset.dataObject.participants = visitorProfileIds;

    if (keyAsset) {
      return res.status(200).json(keyAsset.dataObject);
    }
  } catch (error: any) {
    return errorHandler({
      error,
      functionName: "handleGetDataObject",
      message: "Error getting DataObject",
      req,
      res,
    });
  }
}
