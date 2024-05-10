import { Credentials } from "../types/index.js";
import { getVisitor } from "../utils/index.js";
import { Request, Response, NextFunction } from "express";

const checkIsAdmin = async (credentials: Credentials) => {
  const visitor = await getVisitor(credentials);
  if (!visitor.isAdmin) {
    return false;
  }
  return true
}

async function isAdmin(req: Request, res: Response, next: NextFunction) {
  const { interactivePublicKey, interactiveNonce, urlSlug, visitorId } = req.query as unknown as Credentials;
  const credentials = { interactivePublicKey, interactiveNonce, urlSlug, visitorId } as Credentials;
  const isAdmin = await checkIsAdmin(credentials);
  if (!isAdmin) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

export { isAdmin, checkIsAdmin };
