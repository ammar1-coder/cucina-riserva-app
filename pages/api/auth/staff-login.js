import bcrypt from "bcryptjs";
import { prisma } from "../../../lib/prisma";
import { createToken, setAuthCookie } from "../../../lib/auth";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Metodo non consentito" });

  const { email, pin } = req.body || {};
  if (!email || !pin) return res.status(400).json({ error: "Inserisci email del ristorante e PIN." });

  const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (!user || !user.staffPin) {
    return res.status(401).json({ error: "Nessun accesso staff configurato per questo ristorante." });
  }

  const valid = await bcrypt.compare(pin, user.staffPin);
  if (!valid) return res.status(401).json({ error: "PIN errato." });

  const token = createToken(user, "staff");
  setAuthCookie(res, token);
  return res.status(200).json({ email: user.email, restaurant: user.restaurant, role: "staff" });
}
