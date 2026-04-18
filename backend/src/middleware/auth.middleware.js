import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "change-me";

export function authenticateToken(req, res, next) {
	const header = req.headers.authorization || "";
	const token = header.startsWith("Bearer ") ? header.slice(7) : null;

	if (!token) {
		return res.status(401).json({ message: "Authorization token required." });
	}

	try {
		const payload = jwt.verify(token, JWT_SECRET);
		req.user = {
			id: payload.sub,
			role: payload.role,
		};
		return next();
	} catch {
		return res.status(401).json({ message: "Invalid or expired token." });
	}
}

export function signToken({ userId, role }) {
	return jwt.sign({ sub: userId, role }, JWT_SECRET, { expiresIn: "7d" });
}
