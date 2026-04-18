import { Router } from "express";
import {
  createEmergency,
  getActiveEmergencyList,
  getEmergency,
  getEmergencyResourceList,
  patchEmergencyStatus,
} from "../controllers/emergency.controller.js";
import { asyncHandler } from "../middleware/error.middleware.js";

const router = Router();

router.get("/active", asyncHandler(getActiveEmergencyList));
router.get("/resources", asyncHandler(getEmergencyResourceList));
router.get("/:id", asyncHandler(getEmergency));
router.post("/", asyncHandler(createEmergency));
router.patch("/:id/status", asyncHandler(patchEmergencyStatus));

export default router;
