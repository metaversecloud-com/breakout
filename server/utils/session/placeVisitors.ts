import { DroppedAsset, Visitor } from "@rtsdk/topia";
import { Breakouts } from "../../controllers/session/handleSetBreakoutConfig.js";
import { errorHandler } from "../errorHandler.js";

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
  console.log(`Placing ${participants.length} participants into ${matches.length} groups for ${assetId}`);
  try {
    await Promise.all(promises);
  } catch (error) {
    debugger;
    return errorHandler({
      error,
      functionName: "Cannot move visitors",
      message: "Visitors Error",
    });
  }
};