import { Router } from "express";
import { getDoctors, completeProfile } from "../controllers/doctor.controller.js";
import { asyncHandler } from "../middleware/error.middleware.js";

const router = Router();

router.get("/", asyncHandler(getDoctors));
router.put("/profile/complete", asyncHandler(completeProfile));

export default router;
