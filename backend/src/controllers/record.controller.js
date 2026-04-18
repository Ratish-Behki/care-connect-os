import { listRecordsForUser } from "../services/record.service.js";

export async function getRecords(req, res) {
  const records = await listRecordsForUser({
    userId: req.user?.id,
    role: req.user?.role,
  });

  return res.json({ records });
}
