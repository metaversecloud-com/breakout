import { Credentials } from "../../types/index.js";
import { WorldActivity, defaultDataObject, errorHandler, getCredentials, getDroppedAsset } from "../../utils/index.js";
import { Request, Response } from "express";
import { endBreakout } from "./handleSetBreakoutConfig.js";
import closeIframeForVisitors from "../../utils/session/closeIframeForVisitors.js";

export default async function handleResetSession(req: Request, res: Response) {
  try {
    const credentials = getCredentials(req.query);
    const worldActivity = WorldActivity.create(credentials.urlSlug, {
      credentials: {
        interactiveNonce: credentials.interactiveNonce,
        interactivePublicKey: credentials.interactivePublicKey,
        visitorId: credentials.visitorId,
      },
    });

    const keyAsset = await getDroppedAsset(credentials);
    const visitors = await worldActivity.fetchVisitorsInZone({ droppedAssetId: keyAsset.dataObject.landmarkZoneId });
    const participants = Object.values(visitors).map((visitor) => visitor.profileId);

    const timeFactor = new Date(Math.round(new Date().getTime() / 10000) * 10000);
    const lockId = `${keyAsset.id}_${timeFactor}`;

    await Promise.allSettled([
      keyAsset.updateDataObject(
        { ...defaultDataObject, landmarkZoneId: keyAsset.dataObject.landmarkZoneId },
        {
          lock: {
            lockId,
            releaseLock: false,
          },
        },
      ),
      closeIframeForVisitors({ ...visitors, [credentials.visitorId]: null }, keyAsset.id),
    ]);
    endBreakout(keyAsset.id);
    return res.json({
      success: true,
      dataObject: { ...defaultDataObject, landmarkZoneId: keyAsset.dataObject.landmarkZoneId, participants },
    });
  } catch (error) {
    return errorHandler({
      error,
      functionName: "handleResetSession",
      message: "Error resetting breakout",
      req,
      res,
    });
  }
}
