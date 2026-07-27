import { Request, Response } from "express";
import { errorHandler, getAvailableScenes } from "../../utils/index.js";

/**
 * Returns the list of scenes the admin can swap in — filtered to only
 * those whose backing env var is set at runtime. Each entry is
 * `{ key, title }`; the client maps `key` locally to the bundled
 * preview image under `client/src/assets/<key>.jpg`.
 *
 * Env vars themselves (which hold the actual Topia scene ids) are never
 * exposed to the client.
 */
export default async function handleGetScenes(_req: Request, res: Response) {
  try {
    const scenes = getAvailableScenes();
    return res.json({ scenes, success: true });
  } catch (error) {
    return errorHandler({
      error,
      functionName: "handleGetScenes",
      message: "Error getting available scenes",
      req: _req,
      res,
    });
  }
}
