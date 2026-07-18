import jwt from "jsonwebtoken";
import { serialize, parse } from "cookie";

const COOKIE_NAME = "cucina_riserva_session";
const SECRET = process.env.JWT_SECRET;

export function createToken(user, role = "owner") {
  return jwt.sign({ userId: user.id, email: user.email, role }, SECRET, { expiresIn: "30d" });
}

export function setAuthCookie(res, token) {
  res.setHeader(
    "Set-Cookie",
    serialize(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 giorni
    })
  );
}

export function clearAuthCookie(res) {
  res.setHeader(
    "Set-Cookie",
    serialize(COOKIE_NAME, "", { httpOnly: true, path: "/", maxAge: 0 })
  );
}

export function getUserFromRequest(req) {
  const cookies = parse(req.headers.cookie || "");
  const token = cookies[COOKIE_NAME];
  if (!token) return null;
  try {
    return jwt.verify(token, SECRET);
  } catch (e) {
    return null;
  }
}
