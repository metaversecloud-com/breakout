import { DroppedAsset } from "@rtsdk/topia";
import { Credentials } from "../../types/index.js";
import { getDroppedAssetsBySceneDropId } from "../../utils/droppedAssets/getDroppedAssetsBySceneDropId.js";
import { WorldActivity, errorHandler, getDroppedAsset } from "../../utils/index.js";
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
  const { assetId, interactivePublicKey, interactiveNonce, urlSlug, visitorId, sceneDropId } =
    req.query as unknown as Credentials;

  const numOfGroups = Math.min(parseInt(req.body.numOfGroups), 16);
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

  const [keyAsset, breakoutScene]: [IDroppedAsset, DroppedAsset[]] = await Promise.all([
    getDroppedAsset(credentials),
    getDroppedAssetsBySceneDropId(credentials, sceneDropId),
  ]);

  const privateZones = breakoutScene.filter(
    (droppedAsset: DroppedAsset) => droppedAsset.isPrivateZone,
  ) as DroppedAsset[];
  const landMarkZone = breakoutScene.find(
    (droppedAsset: DroppedAsset) => droppedAsset.isLandmarkZoneEnabled,
  ) as DroppedAsset;

  const worldActivity = WorldActivity.create(urlSlug, {
    credentials: {
      interactiveNonce,
      interactivePublicKey,
      visitorId,
    },
  });

  const timeFactor = new Date(Math.round(new Date().getTime() / 10000) * 10000);
  const lockId = `${keyAsset.id!}_${timeFactor}`;
  const startTime = Date.now();

  const interval = setInterval(
    () => {
      const nextRound = async () => {
        // const timeFactor = new Date(Math.round(new Date().getTime() / 10000) * 10000);
        // const lockId = `${keyAsset.id!}_${timeFactor}`;
        breakouts[keyAsset.id!].data.round += 1;

        try {
          const visitorsObj = await worldActivity.fetchVisitorsInZone(keyAsset.dataObject!.landmarkZoneId);
          const participants = Object.values(visitorsObj)
            .filter((visitor) => {
              if (!includeAdmins) {
                return !visitor.isAdmin;
              }
              return true;
            })
            .map((visitor) => visitor.profileId) as string[];
          const matches = getMatches(false, keyAsset.id!, participants, breakouts);

          console.log(
            `Round ${breakouts[keyAsset.id!].data.round} started for ${keyAsset.id!} with ${participants.length} participants`,
          );

          const timeout = setTimeout(
            () => {
              placeVisitors(matches, visitorsObj, participants, keyAsset.id!, breakouts, privateZones);
            },
            (countdown - 1) * 1000,
          );
          breakouts[keyAsset.id!].timeouts.push(timeout);

          // await Promise.all([
          //   keyAsset.updateDataObject(
          //     {
          //       ...keyAsset.dataObject!,
          //       matches: JSON.stringify(matches),
          //     },
          //     {
          //       lock: {
          //         lockId,
          //         releaseLock: false,
          //       },
          //     },
          //   ),
          //   openIframeForVisitors(visitorsObj, keyAsset.id!),
          // ]);
          await openIframeForVisitors(visitorsObj, keyAsset.id!);

          return { success: true, startTime };
        } catch (error) {
          debugger;
          return errorHandler({
            error,
            functionName: "Cannot go to next round",
            message: "Interval Error",
          });
        }
      };

      const gatherTopis = async () => {
        try {
          const visitorsObj = await worldActivity.fetchVisitorsInZone(keyAsset.dataObject!.landmarkZoneId);
          await moveToLobby(visitorsObj, landMarkZone, keyAsset.id!);
        } catch (error) {
          debugger;
          return errorHandler({
            error,
            functionName: "Cannot gather Topis",
            message: "Visitors Error",
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

  try {
    const visitorsObj = await worldActivity.fetchVisitorsInZone(keyAsset.dataObject!.landmarkZoneId);
    const participants = Object.values(visitorsObj)
    .filter((visitor) => {
      if (!includeAdmins) {
        return !visitor.isAdmin;
      }
      return true;
    })
    .map((visitor) => visitor.profileId) as string[];
    debugger;
    const timeout = setTimeout(
      () => {
        placeVisitors(matches, visitorsObj, participants, keyAsset.id!, breakouts, privateZones);
      },
      (countdown - 1) * 1000,
    );

    breakouts[keyAsset.id!] = {
      interval: interval,
      timeouts: [timeout],
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

    await Promise.all([
      keyAsset.updateDataObject(
        {
          ...keyAsset.dataObject!,
          // matches: JSON.stringify(matches),
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
      openIframeForVisitors(visitors, keyAsset.id!),
    ]);

    console.log(
      `Round ${breakouts[keyAsset.id!].data.round} started for ${keyAsset.id!} with ${participants.length} participants`,
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
