import { getCurrentUserById } from "../services/user.service.js";

export async function getCurrentUser(req, res) {
  const user = await getCurrentUserById(req.user?.id);

  return res.json({ user });
}
