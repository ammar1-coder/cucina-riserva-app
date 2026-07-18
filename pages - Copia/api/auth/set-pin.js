import bcrypt from "bcryptjs";
import { prisma } from "../../../lib/prisma";
import { getUserFromRequest } from "../../../lib/auth";

export default async function handler(req, res) {
  const session = getUserFromRequest(req);
  if (!session) return res.status(401).json({ error: "Non autenticato" });
  if (session.role === "staff") return res.status(403).json({ error: "Solo il titolare può modificare il PIN." });
  if (req.method !== "POST") return res.status(405).json({ error: "Metodo non consentito" });

  const { pin } = req.body || {};
  if (!pin || !/^\d{4,6}$/.test(pin)) {
    return res.status(400).json({ error: "Il PIN deve avere tra 4 e 6 cifre." });
  }

  const pinHash = await bcrypt.hash(pin, 10);
  await prisma.user.update({ where: { id: session.userId }, data: { staffPin: pinHash } });

  return res.status(200).json({ ok: true });
}
