import { WorldActivity, errorHandler, getCredentials, getDroppedAsset } from "../../utils/index.js";
import { Request, Response } from "express";

export default async function handleGetDataObject(req: Request, res: Response) {
  try {
    const credentials = getCredentials(req.query);
    const keyAsset = await getDroppedAsset(credentials);

    if (keyAsset.error) {
      return res.status(404).json({ message: "Asset not found" });
    }

    const worldActivity = WorldActivity.create(credentials.urlSlug, {
      credentials: {
        interactiveNonce: credentials.interactiveNonce,
        interactivePublicKey: credentials.interactivePublicKey,
        visitorId: credentials.visitorId,
      },
    });

    const visitors = await worldActivity.fetchVisitorsInZone({ droppedAssetId: keyAsset.dataObject.landmarkZoneId });
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
