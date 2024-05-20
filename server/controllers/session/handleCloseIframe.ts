import { Request, Response } from "express";
import { errorHandler, getCredentials, getVisitor } from "../../utils/index.js";

export default async function handleCloseIframe(req: Request, res: Response) {
  try {
    const credentials = getCredentials(req.query);
    const visitor = await getVisitor(credentials);
    await visitor.closeIframe(`${req.query?.assetId}`);

    return res.json({ success: true });
  } catch (error) {
    return errorHandler({
      error,
      functionName: "handleCloseIframe",
      message: "Error closing iFrame in visitor UI",
      req,
      res,
    });
  }
}
