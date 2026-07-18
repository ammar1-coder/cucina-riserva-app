import { prisma } from "../../../lib/prisma";
import { getUserFromRequest } from "../../../lib/auth";

export default async function handler(req, res) {
  const session = getUserFromRequest(req);
  if (!session) return res.status(401).json({ error: "Non autenticato" });

  if (req.method === "GET") {
    const suppliers = await prisma.supplier.findMany({
      where: { userId: session.userId },
      include: { items: true },
      orderBy: { name: "asc" },
    });
    return res.status(200).json(suppliers);
  }

  if (req.method === "POST") {
    if (session.role === "staff") return res.status(403).json({ error: "Solo il titolare può gestire i fornitori." });
    const { name, phone, email, notes } = req.body || {};
    if (!name || !name.trim()) return res.status(400).json({ error: "Il nome del fornitore è obbligatorio." });
    const supplier = await prisma.supplier.create({
      data: { name: name.trim(), phone: phone || null, email: email || null, notes: notes || null, userId: session.userId },
    });
    return res.status(200).json(supplier);
  }

  return res.status(405).json({ error: "Metodo non consentito" });
}
