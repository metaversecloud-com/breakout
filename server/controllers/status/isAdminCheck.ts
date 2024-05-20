import { Credentials } from "../../types/index.js";
import { errorHandler, getCredentials, getVisitor } from "../../utils/index.js";
import { Request, Response } from "express";

export default async function isAdminCheck(req: Request, res: Response) {
  try {
    const credentials = getCredentials(req.query);

    const visitor = await getVisitor(credentials);

    if (!visitor) {
      return res.status(404).json({ message: "Visitor not found" });
    } else if (visitor.isAdmin) {
      return res.status(200).json({ isAdmin: true });
    } else {
      return res.status(200).json({ isAdmin: false });
    }
  } catch (error: any) {
    return errorHandler({
      error,
      functionName: "isAdminCheck",
      message: "Error checking admin",
      req,
      res,
    });
  }
}
