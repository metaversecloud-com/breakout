import { DroppedAsset, Visitor } from "@rtsdk/topia";
import { errorHandler } from "../errorHandler.js";

export default async function moveToLobby(visitorsObj: { [key: string]: Visitor }, landMarkZone: DroppedAsset, keyAssetId: string) {
  const visitors = Object.values(visitorsObj);
  const landMarkZoneCenter = [landMarkZone.position!.x, landMarkZone.position!.y];
  const promises: Promise<any>[] = [];

  visitors.forEach((visitor) => {
    const xSign = Math.random() < 0.5 ? -1 : 1;
    promises.push(
      visitor.moveVisitor({
        shouldTeleportVisitor: true,
        x: landMarkZoneCenter[0] + Math.floor(Math.random() * 490) * xSign,
        y: landMarkZoneCenter[1] + 600 + Math.floor(Math.random() * 231),
      }),
    );
  });
  console.log(`Moving ${visitors.length} visitors to lobby for ${keyAssetId}`);
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
}
