import bcrypt from "bcryptjs";
import { prisma } from "../../../lib/prisma";
import { createToken, setAuthCookie } from "../../../lib/auth";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Metodo non consentito" });

  const { restaurant, email, password } = req.body || {};
  if (!restaurant || !email || !password) {
    return res.status(400).json({ error: "Compila tutti i campi." });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "La password deve avere almeno 6 caratteri." });
  }

  const normalizedEmail = email.trim().toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    return res.status(409).json({ error: "Esiste già un account con questa email." });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      passwordHash,
      restaurant: restaurant.trim(),
    },
  });

  const token = createToken(user);
  setAuthCookie(res, token);

  return res.status(200).json({ email: user.email, restaurant: user.restaurant });
}
