import { Credentials } from "../../types/index.js";
import { getCombinations, match } from "../../utils/arrangement.js";
import { getDroppedAssetsBySceneDropId } from "../../utils/droppedAssets/getDroppedAssetsBySceneDropId.js";
import { WorldActivity, errorHandler, getDroppedAsset } from "../../utils/index.js";
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
  visitors: any;
}) => {
  const { keyAssetId, startTime, secondsPerRound, numOfRounds } = data;
  intervals[keyAssetId].data.round += 1;
  console.log(`Round ${intervals[keyAssetId].data.round}. Fight!`);
};

export default async function handleSetBreakoutConfig(req: Request, res: Response) {
  const { assetId, interactivePublicKey, interactiveNonce, urlSlug, visitorId, sceneDropId } =
    req.query as unknown as Credentials;

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

  const credentials = { assetId, interactivePublicKey, interactiveNonce, urlSlug, visitorId, sceneDropId };

  const [keyAsset, breakoutScene] = await Promise.all([
    getDroppedAsset(credentials),
    getDroppedAssetsBySceneDropId(credentials, sceneDropId),
  ]);
  const privateZones = breakoutScene.filter((droppedAsset) => droppedAsset.isPrivateZone);

  const worldActivity = WorldActivity.create(urlSlug, {
    credentials: {
      interactiveNonce,
      interactivePublicKey,
      visitorId,
    },
  });

  // let roundNum = 1;
  // let matchesObj: Record<string, string[][]> = {};

  const getMatches = async (init: boolean) => {
    const visitors = await worldActivity.fetchVisitorsInZone(keyAsset.dataObject.landmarkZoneId);
    const participants = Object.values(visitors).map((visitor) => visitor.profileId) as string[];
    if (init) {
      participants.forEach((el) => {
        matchesObj[el] = [];
      });
    }

    const allCombinations = getCombinations(participants, Math.floor(numOfGroups / participants.length));
    const data = match(allCombinations, roundNum, participants, matchesObj);
    matchesObj = data.matchesObj;
    return data.allMatches;
  };

  const matches = await getMatches(true);
  const placeVisitors = async (matches: string[][]) => {
    const privateZoneCoordinates = privateZones.map((zone: any) => [zone.position.x, zone.position.y]);
    const visitors = await worldActivity.fetchVisitorsInZone(keyAsset.dataObject.landmarkZoneId);
    const promises: Promise<any>[] = [];
    matches.forEach((match, idx) => {
      match.forEach((profileId) => {
        const visitor = Object.values(visitors).find((visitor) => visitor.profileId === profileId);
        let offsetX = Math.floor(Math.random() * (120 - 50 + 1)) + 50;
        let offsetY = Math.floor(Math.random() * (120 - 50 + 1)) + 50;
        if (Math.random() < 0.5) {
          offsetX *= -1;
        }
        if (Math.random() < 0.5) {
          offsetY *= -1;
        }
        promises.push(
          visitor!.moveVisitor({
            shouldTeleportVisitor: true,
            x: privateZoneCoordinates[idx][0] + offsetX,
            y: privateZoneCoordinates[idx][1] + offsetY,
          }),
        );
      });
    });
    await Promise.all(promises);
  };

  const timeFactor = new Date(Math.round(new Date().getTime() / 10000) * 10000);
  const lockId = `${keyAsset.id}_${timeFactor}`;
  const startTime = Date.now();
  
  const interval = setInterval(
    async () => {
      const visitors = await worldActivity.fetchVisitorsInZone(keyAsset.dataObject.landmarkZoneId);
      const participants = Object.values(visitors).map((visitor) => visitor.profileId);
      nextRound({
        keyAssetId: keyAsset.id,
        startTime,
        secondsPerRound: minutes * 60 + seconds,
        numOfRounds,
        visitors,
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
    await Promise.all([
      keyAsset.updateDataObject(
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
      ),
      placeVisitors(matches),
    ]);

    return res.json({ success: true, startTime });
  } catch (err) {
    return errorHandler({
      err,
      functionName: "handleSetBreakoutConfig",
      message: "Error setting breakout",
      req,
      res,
    });
  }
}
