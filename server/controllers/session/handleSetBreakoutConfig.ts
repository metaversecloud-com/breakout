import { DroppedAsset, Visitor } from "@rtsdk/topia";
import { Credentials } from "../../types/index.js";
import { getCombinations, match } from "../../utils/arrangement.js";
import { getDroppedAssetsBySceneDropId } from "../../utils/droppedAssets/getDroppedAssetsBySceneDropId.js";
import { WorldActivity, errorHandler, getDroppedAsset } from "../../utils/index.js";
import { Request, Response } from "express";

const intervals: Record<
  string,
  {
    interval: NodeJS.Timeout | null;
    data: {
      round: number;
      startTime: number;
      secondsPerRound: number;
      numOfRounds: number;
      numOfGroups: number;
      matchesObj: Record<string, string[][]>;
    };
  }
> = {};

export const endBreakout = (key: string) => {
  if (intervals[key]) {
    clearInterval(intervals[key].interval!);
    delete intervals[key];
    console.log(`Breakout ${key} is over!`);
  }
};

setInterval(() => {
  for (const key in intervals) {
    if (
      intervals[key].data.startTime +
        (intervals[key].data.secondsPerRound + 10) * 1000 * intervals[key].data.numOfRounds <
      Date.now()
    ) {
      endBreakout(key);
    }
  }
}, 1000);

export default async function handleSetBreakoutConfig(req: Request, res: Response) {
  const { assetId, interactivePublicKey, interactiveNonce, urlSlug, visitorId, sceneDropId } =
    req.query as unknown as Credentials;

  const numOfGroups = parseInt(req.body.numOfGroups);
  const numOfRounds = parseInt(req.body.numOfRounds);
  const minutes = parseInt(req.body.minutes);
  const seconds = parseInt(req.body.seconds);
  const includeAdmins = req.body.includeAdmins;

  const credentials = {
    assetId,
    interactivePublicKey,
    interactiveNonce,
    urlSlug,
    visitorId,
    sceneDropId,
  } as Credentials;

  const [keyAsset, breakoutScene] = await Promise.all([
    getDroppedAsset(credentials),
    getDroppedAssetsBySceneDropId(credentials, sceneDropId),
  ]);
  const privateZones = breakoutScene.filter(
    (droppedAsset: DroppedAsset) => droppedAsset.isPrivateZone,
  ) as DroppedAsset[];

  const worldActivity = WorldActivity.create(urlSlug, {
    credentials: {
      interactiveNonce,
      interactivePublicKey,
      visitorId,
    },
  });

  const timeFactor = new Date(Math.round(new Date().getTime() / 10000) * 10000);
  const lockId = `${keyAsset.id}_${timeFactor}`;
  const startTime = Date.now();

  intervals[keyAsset.id] = {
    interval: null,
    data: {
      round: 1,
      startTime,
      secondsPerRound: minutes * 60 + seconds,
      numOfRounds,
      numOfGroups,
      matchesObj: {},
    },
  };

  const getMatches = (init: boolean, assetId: string, participants: string[]) => {
    if (init) {
      participants.forEach((el) => {
        intervals[assetId].data.matchesObj[el] = [];
      });
    }
    const allCombinations = getCombinations(
      participants,
      Math.floor(participants.length / intervals[assetId].data.numOfGroups),
    );
    const data = match(
      allCombinations,
      intervals[assetId].data.round,
      participants,
      intervals[assetId].data.matchesObj,
    );
    intervals[assetId].data.matchesObj = data.matchesObj;
    return data.allMatches;
  };

  const openIframeForVisitors = async (visitors: { [key: string]: Visitor }, droppedAssetId: string) => {
    if (process.env.NODE_ENV === "development") {
      return;
    }

    const promises: Promise<any>[] = [];
    const visitorsArr = Object.values(visitors);
    visitorsArr.forEach((visitor) => {
      promises.push(
        visitor.openIframe({
          droppedAssetId,
          link: process.env.APP_URL,
          shouldOpenInDrawer: true,
          title: "Breakout",
        }),
      );
    });
    await Promise.all(promises);
  };

  const placeVisitors = async (
    matches: string[][],
    visitors: {
      [key: string]: Visitor;
    },
    participants: string[],
  ) => {
    if (!intervals[assetId]) {
      return;
    }
    const privateZoneCoordinates = privateZones.map((zone: DroppedAsset) => [zone.position!.x, zone.position!.y]);
    const promises: Promise<any>[] = [];

    matches.forEach((match, idx) => {
      promises.push(
        privateZones[idx].updatePrivateZone({
          isPrivateZone: true,
          isPrivateZoneChatDisabled: false,
          privateZoneUserCap: Math.floor(participants.length / intervals[assetId].data.numOfGroups) + 1,
        }),
      );
      match.forEach((profileId) => {
        const visitor = Object.values(visitors).find((visitor: Visitor) => visitor.profileId === profileId);
        let offsetX = Math.floor(Math.random() * (100 - 50 + 1)) + Math.floor(Math.random() * (100 - 50 + 1));
        let offsetY = Math.floor(Math.random() * (100 - 50 + 1)) + Math.floor(Math.random() * (100 - 50 + 1));
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

  if (numOfRounds > 1) {
    const interval = setInterval(
      () => {
        const nextRound = async () => {
          const timeFactor = new Date(Math.round(new Date().getTime() / 10000) * 10000);
          const lockId = `${keyAsset.id}_${timeFactor}`;
          intervals[keyAsset.id].data.round += 1;

          try {
            const visitorsObj = await worldActivity.fetchVisitorsInZone(keyAsset.dataObject.landmarkZoneId);
            const participants = Object.values(visitorsObj).map((visitor) => visitor.profileId) as string[];

            const matches = getMatches(false, keyAsset.id, participants);

            await Promise.all([
              keyAsset.updateDataObject(
                {
                  ...keyAsset.dataObject,
                  matches: JSON.stringify(matches),
                  participants,
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
              openIframeForVisitors(visitorsObj, keyAsset.id),
            ]);

            setTimeout(() => {
              placeVisitors(matches, visitorsObj, participants);
            }, 9000);

            return { success: true, startTime };
          } catch (err) {
            return errorHandler({
              err,
              functionName: "Cannot go to next round",
              message: "Interval Error",
            });
          }
        };
        if (intervals[keyAsset.id] && intervals[keyAsset.id].data.round < intervals[keyAsset.id].data.numOfRounds) {
          nextRound();
        }
      },
      (60 * minutes + seconds + 10) * 1000,
    );

    intervals[keyAsset.id].interval = interval;
  }

  try {
    const visitors = await worldActivity.fetchVisitorsInZone(keyAsset.dataObject.landmarkZoneId);
    const participants = Object.values(visitors).map((visitor) => visitor.profileId) as string[];
    const matches = getMatches(true, keyAsset.id, participants);

    await Promise.all([
      keyAsset.updateDataObject(
        {
          ...keyAsset.dataObject,
          matches: JSON.stringify(matches),
          participants,
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
      openIframeForVisitors(visitors, keyAsset.id),
    ]);

    setTimeout(() => {
      placeVisitors(matches, visitors, participants);
    }, 9000);

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
