import { Credentials } from "../../types/index.js";
import { errorHandler, getDroppedAsset } from "../../utils/index.js";
import { Request, Response } from "express";

export default async function handleSetBreakoutConfig(req: Request, res: Response) {
  const { assetId, interactivePublicKey, interactiveNonce, urlSlug, visitorId } = req.query as unknown as Credentials;

  const {
    numOfGroups,
    numOfRounds,
    minutes,
    seconds,
    includeAdmins,
  }: {
    numOfGroups: number;
    numOfRounds: number;
    minutes: number;
    seconds: number;
    includeAdmins: boolean;
  } = req.body;

  const credentials = { assetId, interactivePublicKey, interactiveNonce, urlSlug, visitorId };
  // const [isAdmin, keyAsset] = await Promise.all([checkIsAdmin(credentials), getDroppedAsset(credentials)]);
  const keyAsset = await getDroppedAsset(credentials);
  const timeFactor = new Date(Math.round(new Date().getTime() / 10000) * 10000);
  const lockId = `${keyAsset.id}_${timeFactor}`;

  try {
    await keyAsset.updateDataObject(
      {
        ...keyAsset.dataObject,
        startTime: Date.now(),
        secondsPerRound: minutes * 60 + seconds,
        numOfRounds,
        status: "active"
      },
      {
        lock: {
          lockId,
          releaseLock: false,
        },
      },
    );
    return res.json({ success: true });
  } catch (err) {
    return errorHandler({
      err,
      functionName: "handleStartBreakout",
      message: "Error starting breakout",
      req,
      res,
    });
  }
}
