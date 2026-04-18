import { Router } from "express";
import { getCurrentUser } from "../controllers/user.controller.js";
import { asyncHandler } from "../middleware/error.middleware.js";

const router = Router();

router.get("/me", asyncHandler(getCurrentUser));

export default router;
