import { Credentials } from "../../types/index.js";
import { errorHandler, getDroppedAsset } from "../../utils/index.js";
import { Request, Response } from "express";

export default async function handleStartBreakout(req: Request, res: Response) {
  const { assetId, interactivePublicKey, interactiveNonce, urlSlug, visitorId } = req.query as unknown as Credentials;

  const { secondsPerRound, numOfRounds }: { secondsPerRound: number; numOfRounds: number } = req.body;
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
        secondsPerRound,
        numOfRounds,
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
