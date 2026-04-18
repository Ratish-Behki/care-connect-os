import { Router } from "express";
import { getDoctors } from "../controllers/doctor.controller.js";
import { asyncHandler } from "../middleware/error.middleware.js";

const router = Router();

router.get("/", asyncHandler(getDoctors));

export default router;
