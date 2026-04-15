import { Router } from "express";
import { db } from "../data/store.js";

const router = Router();

router.get("/", (_req, res) => {
  return res.json({ records: db.records });
});

export default router;