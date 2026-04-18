import { Router } from "express";
import { runTriage } from "../controllers/triage.controller.js";
import { asyncHandler } from "../middleware/error.middleware.js";

const router = Router();

router.post("/", asyncHandler(runTriage));

export default router;
