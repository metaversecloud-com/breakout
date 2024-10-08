import express from "express";
import { getVersion } from "../utils/getVersion.js";
import isAdminCheck from "../controllers/status/isAdminCheck.js";
import handleGetDataObject from "../controllers/session/handleGetDataObject.js";
import { isAdmin } from "../middleware/isAdmin.js";
import handleSetBreakoutConfig from "../controllers/session/handleSetBreakoutConfig.js";
import handleResetSession from "../controllers/session/handleResetSession.js";
import handleGetParticipantsInZone from "../controllers/session/handleGetParticipantsInZone.js";
import handleCloseIframe from "../controllers/session/handleCloseIframe.js";
import handleCheckInteractiveCredentials from "../controllers/config/handleCheckInteractiveCredentials.js";

const router = express.Router();
const SERVER_START_DATE = new Date();
router.get("/", (req, res) => {
  res.json({ message: "Hello from server!" });
});

router.get("/system/health", (req, res) => {
  return res.json({
    appVersion: getVersion(),
    status: "OK",
    serverStartDate: SERVER_START_DATE,
    envs: {
      NODE_ENV: process.env.NODE_ENV,
      INSTANCE_DOMAIN: process.env.INSTANCE_DOMAIN ? process.env.INSTANCE_DOMAIN : "NOT SET",
      INTERACTIVE_KEY: process.env.INTERACTIVE_KEY ? process.env.INTERACTIVE_KEY : "NOT SET",
      INTERACTIVE_SECRET: process.env.INTERACTIVE_SECRET ? "SET" : "NOT SET",
      APP_URL: process.env.APP_URL ? process.env.APP_URL : "NOT SET",
      COMMIT_HASH: process.env.COMMIT_HASH ? process.env.COMMIT_HASH : "NOT SET",
    },
  });
});

router.get("/system/interactive-credentials", handleCheckInteractiveCredentials);

router.get("/is-admin", isAdminCheck);

router.get("/data-object", handleGetDataObject);
router.get("/get-participants", isAdmin, handleGetParticipantsInZone);
router.post("/set-config", isAdmin, handleSetBreakoutConfig);
router.post("/reset", isAdmin, handleResetSession);
router.post("/close-iframe", handleCloseIframe);

export default router;
