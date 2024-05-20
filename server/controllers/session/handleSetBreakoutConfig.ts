import { DroppedAsset, WorldActivity as IWorldActivity } from "@rtsdk/topia";
import { Credentials } from "../../types/index.js";
import { getDroppedAssetsBySceneDropId } from "../../utils/droppedAssets/getDroppedAssetsBySceneDropId.js";
import { WorldActivity, errorHandler, getCredentials, getDroppedAsset } from "../../utils/index.js";
import { Request, Response } from "express";
import moveToLobby from "../../utils/session/moveToLobby.js";
import getMatches from "../../utils/session/getMatches.js";
import placeVisitors from "../../utils/session/placeVisitors.js";
import openIframeForVisitors from "../../utils/session/openIframeForVisitors.js";
import { IDroppedAsset } from "../../types/DroppedAssetInterface.js";

export type Breakouts = Record<
  string,
  {
    interval: NodeJS.Timeout;
    timeouts: NodeJS.Timeout[];
    adminProfileId: string;
    adminOriginalInteractiveNonce: string;
    adminCredentials: Credentials;
    landmarkZoneId: string;
    data: {
      round: number;
      startTime: number;
      secondsPerRound: number;
      numOfRounds: number;
      numOfGroups: number;
      matchesObj: Record<string, string[][]>;
    };
  }
>;

const breakouts: Breakouts = {};

export const endBreakout = (key: string) => {
  if (breakouts[key]) {
    breakouts[key].timeouts.forEach((timeout) => clearTimeout(timeout));
    clearInterval(breakouts[key].interval);
    delete breakouts[key];
    console.log(`Breakout ${key} is over!`);
  }
};

export const updateAdminCredentials = (credentials: Credentials) => {
  const session = Object.entries(breakouts).find(([_, data]) => data.landmarkZoneId === credentials.assetId);
  if (session && session[1].adminProfileId === credentials.profileId) {
    const [key, _] = session as [string, Breakouts[string]];

    if (
      breakouts[key].adminProfileId === credentials.profileId &&
      breakouts[key].adminOriginalInteractiveNonce !== credentials.interactiveNonce
    ) {
      breakouts[key].adminCredentials = { ...credentials, assetId: key };
    }
  }
};

const countdown = 20;

setInterval(() => {
  for (const key in breakouts) {
    if (
      breakouts[key].data.startTime +
        (breakouts[key].data.secondsPerRound + countdown) * 1000 * breakouts[key].data.numOfRounds +
        5000 <
      Date.now()
    ) {
      endBreakout(key);
    }
  }
}, 1000);

export default async function handleSetBreakoutConfig(req: Request, res: Response) {
  const credentials = getCredentials(req.query);

  const numOfGroups = Math.min(parseInt(req.body.numOfGroups), 16);
  const numOfRounds = Math.min(parseInt(req.body.numOfRounds), 25);
  const minutes = parseInt(req.body.minutes);
  const seconds = parseInt(req.body.seconds);
  const includeAdmins = req.body.includeAdmins;

  if (
    isNaN(minutes) ||
    isNaN(seconds) ||
    60 * minutes + seconds < 10 ||
    isNaN(numOfGroups) ||
    isNaN(numOfRounds) ||
    numOfGroups < 1 ||
    numOfRounds < 1
  ) {
    console.log(`Invalid configuration for ${credentials.assetId}`);
    return res.status(400).json({ message: "Invalid configuration" });
  }

  const [keyAsset, breakoutScene]: [IDroppedAsset, DroppedAsset[]] = await Promise.all([
    getDroppedAsset(credentials),
    getDroppedAssetsBySceneDropId(credentials, credentials.sceneDropId),
  ]);

  const privateZonesAtStart = breakoutScene.filter(
    (droppedAsset: DroppedAsset) => droppedAsset.isPrivateZone,
  ) as DroppedAsset[];
  const landmarkZone = breakoutScene.find(
    (droppedAsset: DroppedAsset) => droppedAsset.isLandmarkZoneEnabled,
  ) as DroppedAsset;

  const worldActivityAtStart = WorldActivity.create(credentials.urlSlug, {
    credentials: {
      interactiveNonce: credentials.interactiveNonce,
      interactivePublicKey: credentials.interactivePublicKey,
      visitorId: credentials.visitorId,
    },
  });

  const timeFactor = new Date(Math.round(new Date().getTime() / 10000) * 10000);
  const lockId = `${keyAsset.id!}_${timeFactor}`;
  const startTime = Date.now();

  try {
    const visitorsObj = await worldActivityAtStart.fetchVisitorsInZone({
      droppedAssetId: keyAsset.dataObject!.landmarkZoneId,
      shouldIncludeAdminPermissions: true,
    });
    const participants = Object.values(visitorsObj)
      .filter((visitor) => {
        if (!includeAdmins) {
          return !visitor.isAdmin;
        }
        return true;
      })
      .map((visitor) => visitor.profileId) as string[];
    if (participants.length < 2) {
      console.log(`Not enough participants to start the breakout ${keyAsset.id}`);
      return res.status(400).json({ message: "Not enough participants" });
    }

    await Promise.all([
      keyAsset.updateDataObject(
        {
          ...keyAsset.dataObject!,
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
      openIframeForVisitors(visitorsObj, keyAsset.id!),
    ]);

    const interval = setInterval(
      () => {
        const nextRound = async () => {
          breakouts[keyAsset.id!].data.round += 1;
          let worldActivity = worldActivityAtStart;
          let privateZones = privateZonesAtStart;

          if (
            breakouts[keyAsset.id!].adminOriginalInteractiveNonce !==
            breakouts[keyAsset.id!].adminCredentials.interactiveNonce
          ) {
            worldActivity = WorldActivity.create(credentials.urlSlug, {
              credentials: {
                interactiveNonce: breakouts[keyAsset.id!].adminCredentials.interactiveNonce,
                interactivePublicKey: credentials.interactivePublicKey,
                visitorId: breakouts[keyAsset.id!].adminCredentials.visitorId,
              },
            });
            const breakoutScene: DroppedAsset[] = await getDroppedAssetsBySceneDropId(
              breakouts[keyAsset.id!].adminCredentials,
              credentials.sceneDropId,
            );
            privateZones = breakoutScene.filter(
              (droppedAsset: DroppedAsset) => droppedAsset.isPrivateZone,
            ) as DroppedAsset[];
          }
          try {
            const visitorsObj = await worldActivity.fetchVisitorsInZone({
              droppedAssetId: keyAsset.dataObject!.landmarkZoneId,
              shouldIncludeAdminPermissions: true,
            });

            const participants = Object.values(visitorsObj)
              .filter((visitor) => {
                if (!includeAdmins) {
                  return !visitor.isAdmin;
                }
                return true;
              })
              .map((visitor) => visitor.profileId) as string[];
            if (participants.length < 2) {
              console.log(`Not enough participants to continue the breakout ${keyAsset.id}`);
              return;
            }
            const matches = getMatches(false, keyAsset.id!, participants, breakouts);

            console.log(
              `Round ${breakouts[keyAsset.id!].data.round} of ${breakouts[keyAsset.id!].data.numOfRounds} started for ${keyAsset.id!} with ${participants.length} participants`,
            );

            const timeout = setTimeout(() => {
              placeVisitors(matches, visitorsObj, participants, keyAsset.id!, breakouts, privateZones);
            }, countdown * 1000);
            breakouts[keyAsset.id!].timeouts.push(timeout);

            await openIframeForVisitors(visitorsObj, keyAsset.id!);

            return { success: true, startTime };
          } catch (error) {
            debugger;
            return errorHandler({
              error,
              functionName: "nextRound",
              message: "Interval Error: Cannot go to next round",
            });
          }
        };

        const gatherTopis = async () => {
          try {
            let worldActivity = worldActivityAtStart;

            if (
              breakouts[keyAsset.id!].adminOriginalInteractiveNonce !==
              breakouts[keyAsset.id!].adminCredentials.interactiveNonce
            ) {
              worldActivity = WorldActivity.create(credentials.urlSlug, {
                credentials: {
                  interactiveNonce: breakouts[keyAsset.id!].adminCredentials.interactiveNonce,
                  interactivePublicKey: credentials.interactivePublicKey,
                  visitorId: breakouts[keyAsset.id!].adminCredentials.visitorId,
                },
              });
            }

            const visitorsObj = await worldActivity.fetchVisitorsInZone({
              droppedAssetId: keyAsset.dataObject.landmarkZoneId,
              shouldIncludeAdminPermissions: true,
            });
            if (!includeAdmins) {
              Object.values(visitorsObj).forEach((visitor) => {
                if (visitor.isAdmin) {
                  delete visitorsObj[visitor.visitorId];
                }
              });
            }
            await moveToLobby(visitorsObj, landmarkZone, keyAsset.id!);
          } catch (error) {
            debugger;
            return errorHandler({
              error,
              functionName: "gatherTopis",
              message: "Visitors Error: Cannot gather Topis",
            });
          }
        };

        if (breakouts[keyAsset.id!] && breakouts[keyAsset.id!].data.round < breakouts[keyAsset.id!].data.numOfRounds) {
          nextRound();
        } else if (
          breakouts[keyAsset.id!] &&
          breakouts[keyAsset.id!].data.round === breakouts[keyAsset.id!].data.numOfRounds
        ) {
          gatherTopis();
        }
      },
      (60 * minutes + seconds + countdown) * 1000,
    );

    breakouts[keyAsset.id!] = {
      interval: interval,
      timeouts: [],
      adminProfileId: credentials.profileId,
      adminOriginalInteractiveNonce: credentials.interactiveNonce,
      adminCredentials: credentials,
      landmarkZoneId: keyAsset.dataObject!.landmarkZoneId,
      data: {
        round: 1,
        startTime,
        secondsPerRound: minutes * 60 + seconds,
        numOfRounds,
        numOfGroups,
        matchesObj: {},
      },
    };

    const matches = getMatches(true, keyAsset.id!, participants, breakouts);

    const timeout = setTimeout(() => {
      placeVisitors(matches, visitorsObj, participants, keyAsset.id!, breakouts, privateZonesAtStart);
    }, countdown * 1000);
    breakouts[keyAsset.id!].timeouts.push(timeout);

    console.log(
      `Round ${breakouts[keyAsset.id!].data.round} of ${breakouts[keyAsset.id!].data.numOfRounds} started for ${keyAsset.id!} with ${participants.length} participants`,
    );

    return res.json({ success: true, startTime });
  } catch (error) {
    debugger;
    return errorHandler({
      error,
      functionName: "handleSetBreakoutConfig",
      message: "Error setting breakout",
      req,
      res,
    });
  }
}
