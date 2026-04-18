import { Router } from "express";
import { getRecords } from "../controllers/record.controller.js";
import { asyncHandler } from "../middleware/error.middleware.js";

const router = Router();

router.get("/", asyncHandler(getRecords));

export default router;
