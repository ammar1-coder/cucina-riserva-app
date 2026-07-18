import bcrypt from "bcryptjs";
import { prisma } from "../../../lib/prisma";
import { createToken, setAuthCookie } from "../../../lib/auth";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Metodo non consentito" });

  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: "Inserisci email e password." });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (!user) {
    return res.status(401).json({ error: "Nessun account trovato con questa email." });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: "Password errata." });
  }

  const token = createToken(user);
  setAuthCookie(res, token);

  return res.status(200).json({ email: user.email, restaurant: user.restaurant });
}
