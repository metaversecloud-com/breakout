import { Credentials } from "../../types/Credentials.js";
import { IDroppedAsset } from "../../types/DroppedAssetInterface.js";
import { errorHandler } from "../errorHandler.js";
import { getDroppedAssetsBySceneDropId } from "./getDroppedAssetsBySceneDropId.js";

export const defaultDataObject = {
  participants: [],
  numOfRounds: 0,
  secondsPerRound: 0,
  startTime: 0,
  status: "waiting",
};

export const initializeBreakoutSession = async (
  droppedAsset: IDroppedAsset,
  credentials: Credentials,
  sceneDropId: string,
) => {
  try {
    const [allAssets, _] = await Promise.all([
      getDroppedAssetsBySceneDropId(credentials, sceneDropId),
      droppedAsset.fetchDataObject(),
    ]);
    const landMarkZoneId = allAssets.filter((asset) => asset.isLandmarkZoneEnabled)[0]?.id;
    if (!droppedAsset?.dataObject?.participants) {
      // adding a lockId and releaseLock will prevent race conditions and ensure the data object is being updated only once until either the time has passed or the operation is complete
      const lockId = `${droppedAsset.id}-${new Date(Math.round(new Date().getTime() / 60000) * 60000)}`;
      await droppedAsset.setDataObject({ ...defaultDataObject, landMarkZoneId }, { lock: { lockId } });
    }

    return;
  } catch (error) {
    errorHandler({
      error,
      functionName: "initializeBreakoutSession",
      message: "Error initializing dropped asset data object",
    });
    return await droppedAsset.fetchDataObject();
  }
};
