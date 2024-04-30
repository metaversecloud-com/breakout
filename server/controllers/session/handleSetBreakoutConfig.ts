import { Credentials } from "../../types/index.js";
import { errorHandler, getDroppedAsset } from "../../utils/index.js";
import { Request, Response } from "express";

const intervals: Record<
  string,
  {
    interval: NodeJS.Timeout;
    data: {
      round: number;
      startTime: number;
      secondsPerRound: number;
      numOfRounds: number;
    };
  }
> = {};

setInterval(() => {
  for (const key in intervals) {
    if (
      intervals[key].data.startTime + intervals[key].data.secondsPerRound * 1000 * intervals[key].data.numOfRounds <
      Date.now()
    ) {
      console.log(`Breakout ${key} is over!`);
      clearInterval(intervals[key].interval);
      delete intervals[key];
    }
  }
}, 1000);

const nextRound = async (data: {
  keyAssetId: string;
  startTime: number;
  secondsPerRound: number;
  numOfRounds: number;
}) => {
  const { keyAssetId, startTime, secondsPerRound, numOfRounds } = data;
  intervals[keyAssetId].data.round += 1;
  console.log(`Round ${intervals[keyAssetId].data.round}. Fight!`);
};

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

  const startTime = Date.now();
  const interval = setInterval(
    () => {
      nextRound({
        keyAssetId: keyAsset.id,
        startTime,
        secondsPerRound: minutes * 60 + seconds,
        numOfRounds,
      });
    },
    (60 * minutes + seconds) * 1000,
  );
  intervals[keyAsset.id] = {
    interval,
    data: {
      round: 1,
      startTime,
      secondsPerRound: minutes * 60 + seconds,
      numOfRounds,
    },
  };

  try {
    await keyAsset.updateDataObject(
      {
        ...keyAsset.dataObject,
        startTime,
        secondsPerRound: minutes * 60 + seconds,
        numOfRounds,
        status: "active",
      },
      {
        lock: {
          lockId,
          releaseLock: false,
        },
      },
    );

    return res.json({ success: true, startTime });
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
