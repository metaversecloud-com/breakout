import { DroppedAsset, Visitor } from "@rtsdk/topia";
import { Breakouts } from "../../controllers/session/handleSetBreakoutConfig.js";
import { errorHandler } from "../errorHandler.js";
import { shuffleArray } from "../arrangement.js";

export default async function placeVisitors(
  matches: string[][],
  visitors: {
    [key: string]: Visitor;
  },
  participants: string[],
  assetId: string,
  breakouts: Breakouts,
  privateZones: DroppedAsset[],
) {
  if (!breakouts[assetId]) {
    return;
  }
  shuffleArray(privateZones);
  const privateZoneCoordinates = privateZones.map((zone: DroppedAsset) => [zone.position!.x, zone.position!.y]);
  const promises: Promise<any>[] = [];

  // Never place into more zones than the scene actually has. `numOfGroups`
  // is already capped at `privateZones.length` in handleSetBreakoutConfig,
  // but this second guard means a mismatched matches array (e.g. resurrected
  // from an older breakout state where the scene has since shrunk) still
  // places safely instead of throwing on out-of-bounds indexing.
  const placementCount = Math.min(matches?.length ?? 0, privateZones.length);
  if (placementCount < (matches?.length ?? 0)) {
    console.warn(
      `Only ${privateZones.length} private zone(s) available for ${matches.length} match group(s); ` +
        `placing ${placementCount} and dropping the rest for ${assetId}.`,
    );
  }

  if (matches && placementCount > 0) {
    for (let idx = 0; idx < placementCount; idx++) {
      const match = matches[idx];
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
        let offsetX = Math.floor(Math.random() * 20);
        let offsetY = Math.floor(Math.random() * 20);
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
    }
  }
  console.log(`Placing ${participants.length} participants into ${placementCount} groups for ${assetId}`);
  try {
    await Promise.allSettled(promises);
  } catch (error) {
    debugger;
    return errorHandler({
      error,
      functionName: "placeVisitors",
      message: "Visitors Error: Cannot move visitors",
    });
  }
}
