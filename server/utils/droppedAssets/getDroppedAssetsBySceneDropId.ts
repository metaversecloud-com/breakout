import { Credentials } from "../../types/Credentials.js";
import { World, errorHandler } from "../index.js";

export const getDroppedAssetsBySceneDropId = async (
  credentials: Credentials,
  sceneDropId: string,
  uniqueName?: string,
) => {
  try {
    const { interactivePublicKey, interactiveNonce, urlSlug, visitorId } = credentials;

    const world = World.create(urlSlug, {
      credentials: {
        interactiveNonce,
        interactivePublicKey,
        visitorId,
      },
    });

    const droppedAssets = await world.fetchDroppedAssetsBySceneDropId({
      sceneDropId,
      uniqueName,
    });

    if (droppedAssets.length > 1) {
      if (uniqueName) {
        return droppedAssets.find((asset) => asset.uniqueName === uniqueName);
      }
      return droppedAssets;
    } else {
      return droppedAssets[0];
    }
  } catch (error) {
    return errorHandler({
      error,
      functionName: "getDroppedAssetsBySceneDropId",
      message: "Error fetching dropped assets with scene drop ID",
    });
  }
};
