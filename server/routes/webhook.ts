import express from "express";
import handleEnterLandmarkZone from "../controllers/session/handleEnterLandmarkZone.js";
import { handleSetup } from "../controllers/config/handleSetup.js";

const webhooks = express.Router();

webhooks.post("/enter-zone", handleEnterLandmarkZone);
webhooks.post("/setup", handleSetup);

export default webhooks;
