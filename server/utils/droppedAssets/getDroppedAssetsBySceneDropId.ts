import { Credentials } from "../../types/Credentials.js";
import { IDroppedAsset } from "../../types/DroppedAssetInterface.js";
import { World, errorHandler } from "../index.js";

export const getDroppedAssetsBySceneDropId = async (credentials: Credentials, sceneDropId: string) => {
  try {
    const { urlSlug } = credentials;

    const world = World.create(urlSlug, { credentials });

    const droppedAssets = (await world.fetchDroppedAssetsBySceneDropId({
      sceneDropId,
    })) as IDroppedAsset[];

    return droppedAssets;
  } catch (error) {
    return errorHandler({
      error,
      functionName: "getDroppedAssetsBySceneDropId",
      message: "Error fetching dropped assets with scene drop ID",
    });
  }
};
