import { DroppedAsset, Visitor } from "@rtsdk/topia";
import { errorHandler } from "../errorHandler.js";

export default async function moveToLobby(visitorsObj: { [key: string]: Visitor }, landmarkZone: DroppedAsset, keyAssetId: string) {
  const visitors = Object.values(visitorsObj);
  const landmarkZoneCenter = [landmarkZone.position!.x, landmarkZone.position!.y];
  const promises: Promise<any>[] = [];

  visitors.forEach((visitor) => {
    const xSign = Math.random() < 0.5 ? -1 : 1;
    promises.push(
      visitor.moveVisitor({
        shouldTeleportVisitor: true,
        x: landmarkZoneCenter[0] + Math.floor(Math.random() * 490) * xSign,
        y: landmarkZoneCenter[1] + 600 + Math.floor(Math.random() * 231),
      }),
    );
  });
  console.log(`Moving ${visitors.length} visitors to lobby for ${keyAssetId}`);
  try {
    await Promise.allSettled(promises);
  } catch (error: any) {
    debugger;
    return errorHandler({
      error,
      functionName: "moveToLobby",
      message: "Visitors Error: Cannot move visitors to lobby",
    });
  }
}
