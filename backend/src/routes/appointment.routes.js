import { Router } from "express";
import {
  bookAppointment,
  cancelAppointment,
  getAppointments,
} from "../controllers/appointment.controller.js";
import { asyncHandler } from "../middleware/error.middleware.js";

const router = Router();

router.get("/", asyncHandler(getAppointments));
router.post("/", asyncHandler(bookAppointment));
router.delete("/:id", asyncHandler(cancelAppointment));

export default router;
