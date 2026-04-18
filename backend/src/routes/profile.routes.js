import { Router } from "express";
import { getProfile, updateProfile } from "../controllers/profile.controller.js";
import { asyncHandler } from "../middleware/error.middleware.js";

const router = Router();

router.get("/", asyncHandler(getProfile));
router.put("/", asyncHandler(updateProfile));

export default router;
