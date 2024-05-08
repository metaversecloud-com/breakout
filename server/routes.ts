import express from "express";
import {
  handleDropAsset,
  handleGetDroppedAsset,
  handleGetVisitor,
  handleRemoveDroppedAssetsByUniqueName,
  handleGetWorldDetails,
  handleUpdateWorldDataObject,
  handleCheckInteractiveCredentials,
} from "./controllers/index.js";
import { getVersion } from "./utils/getVersion.js";
import isAdminCheck from "./controllers/status/isAdminCheck.js";
import GetDataObject from "./controllers/session/GetDataObject.js";
import { isAdmin } from "./middleware/isAdmin.js";
import handleSetBreakoutConfig from "./controllers/session/handleSetBreakoutConfig.js";
import handleResetSession from "./controllers/session/handleResetSession.js";
import GetParticipantsInZone from "./controllers/session/GetParticipantsInZone.js";

const router = express.Router();

router.get("/", (req, res) => {
  res.json({ message: "Hello from server!" });
});

router.get("/system/health", (req, res) => {
  return res.json({
    appVersion: getVersion(),
    status: "OK",
    envs: {
      NODE_ENV: process.env.NODE_ENV,
      INSTANCE_DOMAIN: process.env.INSTANCE_DOMAIN,
      INTERACTIVE_KEY: process.env.INTERACTIVE_KEY,
      S3_BUCKET: process.env.S3_BUCKET,
    },
  });
});

router.get("/system/interactive-credentials", handleCheckInteractiveCredentials);

// Dropped Assets
router.post("/dropped-asset", handleDropAsset);
router.get("/dropped-asset", handleGetDroppedAsset);
router.post("/remove-dropped-assets", handleRemoveDroppedAssetsByUniqueName);

// Visitor
router.get("/visitor", handleGetVisitor);

// World
router.get("/world", handleGetWorldDetails);
router.put("/world/data-object", handleUpdateWorldDataObject);

router.get("/is-admin", isAdminCheck);

router.get("/data-object", GetDataObject);
router.get("/get-participants", isAdmin, GetParticipantsInZone);
router.post("/set-config", isAdmin, handleSetBreakoutConfig);
router.post("/reset", isAdmin, handleResetSession);

export default router;
