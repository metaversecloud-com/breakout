import { Request, Response } from "express";
import { getDroppedAssetsBySceneDropId } from "../../utils/droppedAssets/getDroppedAssetsBySceneDropId.js";
import { errorHandler } from "../../utils/errorHandler.js";
import { getCredentials } from "../../utils/getCredentials.js";

export const handleSetup = async (req: Request, res: Response): Promise<Record<string, any> | void> => {
  const credentials = getCredentials(req.body);
  try {
    console.log("Setting up");
    const allAssets = await getDroppedAssetsBySceneDropId(credentials, credentials.sceneDropId);
    const updatePromises = [];
    for (const asset of allAssets) {
      updatePromises.push(
        asset.setInteractiveSettings({
          isInteractive: true,
          interactivePublicKey: process.env.INTERACTIVE_KEY,
        }),
      );
    }
    await Promise.all(updatePromises);
    res.status(200).send({ message: "Keys set up" });
  } catch (error) {
    return errorHandler({ error, functionName: "handleSetup", message: "Cannot Setup Keys", req, res });
  }
};
