import { Credentials } from "../../types/index.js";
import { WorldActivity, defaultDataObject, errorHandler, getDroppedAsset } from "../../utils/index.js";
import { Request, Response } from "express";
import { endBreakout } from "./handleSetBreakoutConfig.js";

export default async function handleResetSession(req: Request, res: Response) {
  const { assetId, interactivePublicKey, interactiveNonce, urlSlug, visitorId } = req.query as unknown as Credentials;

  const credentials = { assetId, interactivePublicKey, interactiveNonce, urlSlug, visitorId } as Credentials;
  const worldActivity = WorldActivity.create(urlSlug, {
    credentials: {
      interactiveNonce,
      interactivePublicKey,
      visitorId,
    },
  });

  const keyAsset = await getDroppedAsset(credentials);
  const visitors = await worldActivity.fetchVisitorsInZone(keyAsset.dataObject.landmarkZoneId);
  const participants = Object.values(visitors).map((visitor) => visitor.profileId);

  const timeFactor = new Date(Math.round(new Date().getTime() / 10000) * 10000);
  const lockId = `${keyAsset.id}_${timeFactor}`;

  try {
    await keyAsset.updateDataObject(
      { ...defaultDataObject, landmarkZoneId: keyAsset.dataObject.landmarkZoneId },
      {
        lock: {
          lockId,
          releaseLock: false,
        },
      },
    );
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
