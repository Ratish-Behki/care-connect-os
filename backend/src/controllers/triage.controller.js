import { analyzeSymptomsForUser } from "../services/triage.service.js";

export async function runTriage(req, res) {
  const result = await analyzeSymptomsForUser({
    userId: req.user?.id,
    symptoms: req.body?.symptoms,
  });

  return res.json({ result });
}
