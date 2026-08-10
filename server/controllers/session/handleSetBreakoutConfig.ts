import { DroppedAsset, DroppedAssetInterface, Visitor, VisitorInterface, WorldActivityType } from "@rtsdk/topia";
import { AnalyticType, Credentials } from "../../types/index.js";
import { getDroppedAssetsBySceneDropId } from "../../utils/droppedAssets/getDroppedAssetsBySceneDropId.js";
import { World, WorldActivity, errorHandler, getCredentials, getDroppedAsset } from "../../utils/index.js";
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
  const { assetId, profileId, interactiveNonce } = credentials;
  const session = Object.entries(breakouts).find(([_, data]) => data.landmarkZoneId === assetId);
  if (session && session[1].adminProfileId === profileId) {
    const [key, _] = session as [string, Breakouts[string]];

    if (
      breakouts[key].adminProfileId === profileId &&
      breakouts[key].adminOriginalInteractiveNonce !== interactiveNonce
    ) {
      breakouts[key].adminCredentials = { ...credentials, assetId: key };
    }
  }
};

const countdown = 10;

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

const getAnalytics = (includedVisitors: Visitor[], matches: string[][], urlSlug: string) => {
  const participantsAnalytics: AnalyticType[] = includedVisitors.map((visitor) => {
    return {
      analyticName: "joinRound",
      profileId: visitor.profileId as string,
      uniqueKey: visitor.profileId as string,
    };
  });

  const groupSizeAnalytics: { [key: string]: AnalyticType } = {};
  matches.forEach((match) => {
    const analyticName = `groupsOf${match.length}`;
    if (groupSizeAnalytics[analyticName]) {
      groupSizeAnalytics[analyticName].incrementBy! += 1;
    } else {
      groupSizeAnalytics[analyticName] = {
        analyticName,
        incrementBy: 1,
        urlSlug,
      };
    }
  });

  return { participantsAnalytics, groupSizeAnalytics: Object.values(groupSizeAnalytics) };
};

export default async function handleSetBreakoutConfig(req: Request, res: Response) {
  try {
    const credentials = getCredentials(req.query);
    const { assetId, profileId, interactiveNonce, sceneDropId, urlSlug } = credentials;

    const numOfGroupsRequested = parseInt(req.body.numOfGroups);
    const numOfRounds = Math.min(parseInt(req.body.numOfRounds), 25);
    const minutes = parseInt(req.body.minutes);
    const seconds = parseInt(req.body.seconds);
    const includeAdmins = req.body.includeAdmins;

    if (
      isNaN(minutes) ||
      isNaN(seconds) ||
      60 * minutes + seconds < 10 ||
      60 * minutes + seconds > 600 ||
      isNaN(numOfGroupsRequested) ||
      isNaN(numOfRounds) ||
      numOfGroupsRequested < 1 ||
      numOfRounds < 1
    ) {
      console.log(`Invalid configuration for ${assetId}`);
      return res.status(400).json({ message: "Invalid configuration" });
    }
    const [keyAsset, breakoutScene]: [IDroppedAsset, DroppedAsset[]] = await Promise.all([
      getDroppedAsset(credentials),
      getDroppedAssetsBySceneDropId(credentials, sceneDropId),
    ]);

    const privateZonesAtStart = breakoutScene.filter(
      (droppedAsset: DroppedAssetInterface) => droppedAsset.isPrivateZone,
    ) as DroppedAsset[];
    const landmarkZone = breakoutScene.find(
      (droppedAsset: DroppedAssetInterface) => droppedAsset.isLandmarkZoneEnabled,
    ) as DroppedAsset;

    // Cap `numOfGroups` at the actual number of private zones in the scene —
    // the layout is scene-authored and can be any size (8, 16, or otherwise).
    // Previously this was hardcoded to 16 which either let more groups form
    // than there were zones (out-of-bounds placement) or wasted extra zones.
    if (privateZonesAtStart.length < 1) {
      console.log(`No private zones found in scene for ${assetId}`);
      return res.status(400).json({ message: "No private zones configured in this scene" });
    }
    const numOfGroups = Math.min(numOfGroupsRequested, privateZonesAtStart.length);

    const worldActivityAtStart = WorldActivity.create(urlSlug, { credentials });

    const timeFactor = new Date(Math.round(new Date().getTime() / 10000) * 10000);
    const lockId = `${keyAsset.id!}_${timeFactor}`;
    const startTime = Date.now();

    const visitorsObj = await worldActivityAtStart.fetchVisitorsInZone({
      droppedAssetId: keyAsset.dataObject!.landmarkZoneId,
      shouldIncludeAdminPermissions: true,
    });
    const includedVisitors = Object.values(visitorsObj).filter((visitor: VisitorInterface) => {
      if (!includeAdmins) return !visitor.isAdmin;
      return true;
    });
    const participants = includedVisitors.map((visitor) => visitor.profileId) as string[];

    if (participants.length < 2) {
      console.log(`Not enough participants to start the breakout ${keyAsset.id}`);
      return res.status(400).json({ message: "Not enough participants" });
    }

    await Promise.allSettled([
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
          analytics: [
            {
              analyticName: "starts",
              urlSlug: urlSlug,
            },
            {
              analyticName: `groupConfigOf${numOfGroups}`,
              urlSlug: urlSlug,
            },
            {
              analyticName: "rounds",
            },
          ],
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
          try {
            if (
              breakouts[keyAsset.id!].adminOriginalInteractiveNonce !==
              breakouts[keyAsset.id!].adminCredentials.interactiveNonce
            ) {
              worldActivity = WorldActivity.create(urlSlug, { credentials });
              const breakoutScene: DroppedAsset[] = await getDroppedAssetsBySceneDropId(
                breakouts[keyAsset.id!].adminCredentials,
                sceneDropId,
              );
              privateZones = breakoutScene.filter(
                (droppedAsset: DroppedAssetInterface) => droppedAsset.isPrivateZone,
              ) as DroppedAsset[];
            }

            const visitorsObj = await worldActivity.fetchVisitorsInZone({
              droppedAssetId: keyAsset.dataObject!.landmarkZoneId,
              shouldIncludeAdminPermissions: true,
            });

            const includedVisitors = Object.values(visitorsObj).filter((visitor: VisitorInterface) => {
              if (!includeAdmins) return !visitor.isAdmin;
              return true;
            });
            const participants = includedVisitors.map((visitor) => visitor.profileId) as string[];
            if (participants.length < 2) {
              console.log(`Not enough participants to continue the breakout ${keyAsset.id}`);
              return;
            }
            const matches = getMatches(false, keyAsset.id!, participants, breakouts);

            console.log(
              `Round ${breakouts[keyAsset.id!].data.round} of ${breakouts[keyAsset.id!].data.numOfRounds} started for ${keyAsset.id!} with ${participants.length} participants`,
            );

            const timeout = setTimeout(() => {
              const world = World.create(urlSlug, { credentials });
              world
                .triggerParticle({
                  name: "pastelConfetti_fall",
                  duration: 5,
                  position: keyAsset.position,
                })
                .catch((error) =>
                  errorHandler({
                    error,
                    functionName: "handleSetBreakoutConfig",
                    message: "Error triggering particle effects",
                  }),
                );

              placeVisitors(matches, visitorsObj, participants, keyAsset.id!, breakouts, privateZones);
            }, countdown * 1000);

            breakouts[keyAsset.id!].timeouts.push(timeout);

            const { participantsAnalytics, groupSizeAnalytics } = getAnalytics(includedVisitors, matches, urlSlug);

            keyAsset
              .updateDataObject(
                {},
                {
                  analytics: [
                    {
                      analyticName: "rounds",
                    },
                    ...groupSizeAnalytics,
                    ...participantsAnalytics,
                  ],
                },
              )
              .then()
              .catch(() => console.error("Error sending analytics for round"));

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
              worldActivity = WorldActivity.create(urlSlug, { credentials });
            }

            const visitorsObj = await worldActivity.fetchVisitorsInZone({
              droppedAssetId: keyAsset.dataObject!.landmarkZoneId,
              shouldIncludeAdminPermissions: true,
            });
            if (!includeAdmins) {
              Object.values(visitorsObj).forEach((visitor: VisitorInterface) => {
                if (visitor.isAdmin) {
                  // @ts-ignore
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
      adminProfileId: profileId,
      adminOriginalInteractiveNonce: interactiveNonce,
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
      const world = World.create(urlSlug, { credentials });
      world.triggerActivity({ type: WorldActivityType.GAME_ON, assetId }).catch((error) =>
        errorHandler({
          error,
          functionName: "handleSetBreakoutConfig",
          message: "Error triggering world activity",
        }),
      );

      world
        .triggerParticle({
          name: "pastelConfetti_fall",
          duration: 5,
          position: keyAsset.position,
        })
        .catch((error) =>
          errorHandler({
            error,
            functionName: "handleSetBreakoutConfig",
            message: "Error triggering world activity",
          }),
        );

      placeVisitors(matches, visitorsObj, participants, keyAsset.id!, breakouts, privateZonesAtStart);
    }, countdown * 1000);

    breakouts[keyAsset.id!].timeouts.push(timeout);

    const { participantsAnalytics, groupSizeAnalytics } = getAnalytics(includedVisitors, matches, urlSlug);

    keyAsset
      .updateDataObject(
        {},
        {
          analytics: [...groupSizeAnalytics, ...participantsAnalytics],
        },
      )
      .then()
      .catch(() => console.log("Cannot update analytics"));

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
