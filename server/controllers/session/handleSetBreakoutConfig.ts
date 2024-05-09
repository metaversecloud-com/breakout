import { DroppedAsset, Visitor } from "@rtsdk/topia";
import { Credentials } from "../../types/index.js";
import { getCombinations, match } from "../../utils/arrangement.js";
import { getDroppedAssetsBySceneDropId } from "../../utils/droppedAssets/getDroppedAssetsBySceneDropId.js";
import { WorldActivity, errorHandler, getDroppedAsset } from "../../utils/index.js";
import { Request, Response } from "express";

const breakouts: Record<
  string,
  {
    interval: NodeJS.Timeout | null;
    timeout: NodeJS.Timeout | null;
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
  if (breakouts[key] && breakouts[key].timeout) {
    clearTimeout(breakouts[key].timeout as NodeJS.Timeout);
  }
  if (breakouts[key] && breakouts[key].interval) {
    clearInterval(breakouts[key].interval as NodeJS.Timeout);
  }

  if (breakouts[key]) {
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
  const lockId = `${keyAsset.id}_${timeFactor}`;
  const startTime = Date.now();

  breakouts[keyAsset.id] = {
    interval: null,
    timeout: null,
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
    participants?.forEach((el) => {
      if (init) {
        breakouts[assetId].data.matchesObj[el] = [];
      } else if (!breakouts[assetId].data.matchesObj[el]) {
        breakouts[assetId].data.matchesObj[el] = [];
      }
    });
    const allCombinations = getCombinations(
      participants,
      Math.max(
        (participants.length - (participants.length % breakouts[assetId].data.numOfGroups)) /
          breakouts[assetId].data.numOfGroups,
        2,
      ),
    );
    const data = match(
      allCombinations,
      breakouts[assetId].data.round,
      participants,
      breakouts[assetId].data.matchesObj,
    );
    breakouts[assetId].data.matchesObj = data.matchesObj;
    return data.allMatches;
  };

  const openIframeForVisitors = async (visitors: { [key: string]: Visitor }, droppedAssetId: string) => {
    if (process.env.NODE_ENV === "development") {
      return;
    }

    const promises: Promise<any>[] = [];
    const visitorsArr = Object.values(visitors);
    if (visitorsArr && visitorsArr.length > 0) {
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
    }
    try {
      await Promise.all(promises);
    } catch (err) {
      debugger;
      return errorHandler({
        err,
        functionName: "Cannot open iframes",
        message: "Error opening Iframes",
      });
    }
  };

  const placeVisitors = async (
    matches: string[][],
    visitors: {
      [key: string]: Visitor;
    },
    participants: string[],
  ) => {
    if (!breakouts[assetId]) {
      return;
    }
    const privateZoneCoordinates = privateZones.map((zone: DroppedAsset) => [zone.position!.x, zone.position!.y]);
    const promises: Promise<any>[] = [];
    if (matches && matches.length > 0) {
      matches.forEach((match, idx) => {
        promises.push(
          privateZones[idx].updatePrivateZone({
            isPrivateZone: true,
            isPrivateZoneChatDisabled: false,
            privateZoneUserCap:
              (participants.length - (participants.length % breakouts[assetId].data.numOfGroups)) /
                breakouts[assetId].data.numOfGroups +
              1,
          }),
        );
        match?.forEach((profileId) => {
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
    }
    try {
      await Promise.all(promises);
    } catch (err) {
      debugger;
      return errorHandler({
        err,
        functionName: "Cannot move visitors",
        message: "Visitors Error",
      });
    }
  };

  const moveToLobby = async (visitorsObj: { [key: string]: Visitor }) => {
    const visitors = Object.values(visitorsObj);
    const landMarkZoneCenter = [landMarkZone.position!.x, landMarkZone.position!.y];
    const promises: Promise<any>[] = [];

    visitors.forEach((visitor) => {
      const xSign = Math.random() < 0.5 ? -1 : 1;
      promises.push(
        visitor.moveVisitor({
          shouldTeleportVisitor: true,
          x: landMarkZoneCenter[1] + Math.floor(Math.random() * 490) * xSign,
          y: landMarkZoneCenter[1] + 600 + Math.floor(Math.random() * 231),
        }),
      );
    });
    try {
      await Promise.all(promises);
    } catch (err) {
      debugger;
      return errorHandler({
        err,
        functionName: "Cannot move visitors to lobby",
        message: "Visitors Error",
      });
    }
  };

  const interval = setInterval(
    () => {
      const nextRound = async () => {
        const timeFactor = new Date(Math.round(new Date().getTime() / 10000) * 10000);
        const lockId = `${keyAsset.id}_${timeFactor}`;
        breakouts[keyAsset.id].data.round += 1;

        try {
          const visitorsObj = await worldActivity.fetchVisitorsInZone(keyAsset.dataObject.landmarkZoneId);
          const participants = Object.values(visitorsObj).map((visitor) => visitor.profileId) as string[];
          const matches = getMatches(false, keyAsset.id, participants);

          console.log(
            `Round ${breakouts[keyAsset.id].data.round} started for ${keyAsset.id} with ${participants.length} participants`,
          );

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

          const timeout = setTimeout(
            () => {
              placeVisitors(matches, visitorsObj, participants);
            },
            (countdown - 1) * 1000,
          );
          breakouts[keyAsset.id].timeout = timeout;

          return { success: true, startTime };
        } catch (err) {
          debugger;
          return errorHandler({
            err,
            functionName: "Cannot go to next round",
            message: "Interval Error",
          });
        }
      };

      const gatherTopis = async () => {
        try {
          const visitorsObj = await worldActivity.fetchVisitorsInZone(keyAsset.dataObject.landmarkZoneId);
          await moveToLobby(visitorsObj);
        } catch (err) {
          debugger;
          return errorHandler({
            err,
            functionName: "Cannot gather Topis",
            message: "Visitors Error",
          });
        }
      };

      if (breakouts[keyAsset.id] && breakouts[keyAsset.id].data.round < breakouts[keyAsset.id].data.numOfRounds) {
        nextRound();
      } else if (
        breakouts[keyAsset.id] &&
        breakouts[keyAsset.id].data.round === breakouts[keyAsset.id].data.numOfRounds
      ) {
        gatherTopis();
      }
    },
    (60 * minutes + seconds + countdown) * 1000,
  );

  breakouts[keyAsset.id].interval = interval;

  try {
    const visitors = await worldActivity.fetchVisitorsInZone(keyAsset.dataObject.landmarkZoneId);
    const participants = Object.values(visitors).map((visitor) => visitor.profileId) as string[];
    const matches = getMatches(true, keyAsset.id, participants);

    console.log(
      `Round ${breakouts[keyAsset.id].data.round} started for ${keyAsset.id} with ${participants.length} participants`,
    );

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

    const timeout = setTimeout(
      () => {
        placeVisitors(matches, visitors, participants);
      },
      (countdown - 1) * 1000,
    );
    breakouts[keyAsset.id].timeout = timeout;

    return res.json({ success: true, startTime });
  } catch (err) {
    debugger;
    return errorHandler({
      err,
      functionName: "handleSetBreakoutConfig",
      message: "Error setting breakout",
      req,
      res,
    });
  }
}
