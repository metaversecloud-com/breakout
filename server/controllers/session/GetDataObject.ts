import { Credentials } from "../../types/index.js";
import { errorHandler, getDroppedAsset } from "../../utils/index.js";
import { Request, Response } from "express";

export default async function GetDataObject(req: Request, res: Response) {
  try {
    const { assetId, interactivePublicKey, interactiveNonce, urlSlug, visitorId } = req.query as unknown as Credentials;
    const credentials = { assetId, interactivePublicKey, interactiveNonce, urlSlug, visitorId };
    const keyAsset = await getDroppedAsset(credentials);
    if (keyAsset.error) {
      return res.status(404).json({ message: "Asset not found" });
    }
    if (keyAsset) {
      return res.status(200).json(keyAsset.dataObject);
    }
  } catch (err: any) {
    return errorHandler({
      err,
      functionName: "GetJukeboxDataObject",
      message: "Error getting Jukebox",
      req,
      res
    });
  }
}
