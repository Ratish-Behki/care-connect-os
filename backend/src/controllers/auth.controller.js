import { loginUser, registerUser } from "../services/auth.service.js";

export async function login(req, res) {
	const result = await loginUser(req.body);
	return res.json(result);
}

export async function register(req, res) {
	const result = await registerUser(req.body);
	return res.status(201).json(result);
}

export async function signup(req, res) {
	return register(req, res);
}
