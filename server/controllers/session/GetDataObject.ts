import { Credentials } from "../../types/index.js";
import { WorldActivity, errorHandler, getDroppedAsset } from "../../utils/index.js";
import { Request, Response } from "express";

export default async function GetDataObject(req: Request, res: Response) {
  try {
    const { assetId, interactivePublicKey, interactiveNonce, urlSlug, visitorId, sceneDropId } =
      req.query as unknown as Credentials;
    const credentials = { assetId, interactivePublicKey, interactiveNonce, urlSlug, visitorId, sceneDropId };

    const worldActivity = WorldActivity.create(urlSlug, {
      credentials: {
        interactiveNonce,
        interactivePublicKey,
        visitorId,
      },
    });

    const keyAsset = await getDroppedAsset(credentials);
    const visitors = await worldActivity.fetchVisitorsInZone(keyAsset.dataObject.landmarkZoneId);
    const visitorProfileIds = Object.values(visitors).map((visitor) => visitor.profileId);

    keyAsset.dataObject.participants = visitorProfileIds;

    if (keyAsset.error) {
      return res.status(404).json({ message: "Asset not found" });
    }
    if (keyAsset) {
      return res.status(200).json(keyAsset.dataObject);
    }
  } catch (err: any) {
    return errorHandler({
      err,
      functionName: "GetJukeboxDataObject",
      message: "Error getting Jukebox",
      req,
      res,
    });
  }
}
