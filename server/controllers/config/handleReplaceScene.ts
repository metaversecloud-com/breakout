import { Request, Response } from "express";
import {
  errorHandler,
  getCredentials,
  getDroppedAsset,
  getSceneIdForKey,
  getVisitor,
  World,
} from "../../utils/index.js";
import { DroppedAssetInterface } from "@rtsdk/topia";

/**
 * Swap the currently-dropped Breakout scene for one of the admin-selectable
 * presets. Request body: `{ key: string }` where `key` matches a `SceneOption`
 * in `sceneCatalog.ts` whose env var is set.
 */
export default async function handleReplaceScene(req: Request, res: Response) {
  try {
    const credentials = getCredentials(req.query);
    const { assetId, sceneDropId, urlSlug } = credentials;

    const { key } = req.body ?? {};

    if (typeof key !== "string" || !key.trim()) {
      return res.status(400).json({ success: false, message: "A scene `key` is required." });
    }

    const sceneId = getSceneIdForKey(key);
    if (!sceneId) {
      return res.status(400).json({
        success: false,
        message: `No scene configured for key "${key}". Make sure the matching SCENE_ID_* env var is set.`,
      });
    }

    const keyAsset = await getDroppedAsset(credentials);

    const world = World.create(urlSlug, { credentials });

    const droppedAssets: DroppedAssetInterface[] = await world.fetchDroppedAssetsBySceneDropId({ sceneDropId });

    const droppedAssetIds: string[] = [];
    for (const droppedAsset of droppedAssets) {
      if (!droppedAsset.id || droppedAsset.id === assetId) continue;
      droppedAssetIds.push(droppedAsset.id);
    }

    if (droppedAssetIds.length > 0) {
      await World.deleteDroppedAssets(urlSlug, droppedAssetIds, process.env.INTERACTIVE_SECRET!, credentials);
    }

    const container = droppedAssets.filter((da) => da.uniqueName === "Breakout_container")[0];
    const position = container?.position || keyAsset.position;

    await world.dropScene({
      allowNonAdmins: true,
      position: { x: position.x - 30, y: position.y - 70 },
      sceneDropId,
      sceneId,
    });

    try {
      const visitor = await getVisitor(credentials);
      await visitor.closeIframe(assetId).catch((err: unknown) => {
        console.warn(`swapScene: closeIframe(${assetId}) failed:`, err);
      });
    } catch (err) {
      console.warn(`swapScene: could not get visitor to close iframe:`, err);
    }

    await keyAsset.deleteDroppedAsset();

    return res.json({ success: true });
  } catch (error) {
    return errorHandler({
      error,
      functionName: "handleReplaceScene",
      message: "Error replacing scene",
      req,
      res,
    });
  }
}
