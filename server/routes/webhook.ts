import express from "express";
import handleEnterLandmarkZone from "../controllers/session/handleEnterLandmarkZone.js";

const webhooks = express.Router();

webhooks.post("/enter-zone", handleEnterLandmarkZone);

export default webhooks;
