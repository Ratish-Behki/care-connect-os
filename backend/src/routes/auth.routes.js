import { Router } from "express";
import { login, register, signup } from "../controllers/auth.controller.js";
import { asyncHandler } from "../middleware/error.middleware.js";

const router = Router();

router.post("/login", asyncHandler(login));
router.post("/register", asyncHandler(register));
router.post("/signup", asyncHandler(signup));

export default router;
