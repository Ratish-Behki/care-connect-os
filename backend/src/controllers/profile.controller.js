import { getProfileForUser, updateProfileForUser } from "../services/profile.service.js";

export async function getProfile(req, res) {
  const profile = await getProfileForUser(req.user?.id);
  return res.json(profile);
}

export async function updateProfile(req, res) {
  const profile = await updateProfileForUser({
    userId: req.user?.id,
    role: req.user?.role,
    input: req.body,
  });

  return res.json(profile);
}
