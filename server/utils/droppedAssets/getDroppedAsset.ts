import { IDroppedAsset } from "../../types/DroppedAssetInterface.js";
import { Credentials } from "../../types/index.js";
import { errorHandler } from "../errorHandler.js";
import { DroppedAsset } from "../topiaInit.js";
import { initializeBreakoutSession } from "./initializeBreakoutSession.js";

export const getDroppedAsset = async (credentials: Credentials) => {
  try {
    const { assetId, urlSlug, sceneDropId } = credentials;

    const droppedAsset = await DroppedAsset.get(assetId, urlSlug, { credentials }) as IDroppedAsset;

    if (!droppedAsset) throw "Dropped asset not found";

    if (!droppedAsset.dataObject || !droppedAsset.dataObject.participants) {
      await initializeBreakoutSession(droppedAsset, credentials, sceneDropId);
    }
    
    return droppedAsset;
  } catch (error) {
    return errorHandler({
      error,
      functionName: "getDroppedAsset",
      message: "Error getting dropped asset",
    });
  }
};
