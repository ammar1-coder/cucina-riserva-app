import { prisma } from "../../../../lib/prisma";
import { getUserFromRequest } from "../../../../lib/auth";

export default async function handler(req, res) {
  const session = getUserFromRequest(req);
  if (!session) return res.status(401).json({ error: "Non autenticato" });
  if (req.method !== "GET") return res.status(405).json({ error: "Metodo non consentito" });

  const { code } = req.query;
  if (!code) return res.status(400).json({ error: "Codice mancante." });

  const inventoryItem = await prisma.inventoryItem.findUnique({
    where: { userId_barcode: { userId: session.userId, barcode: code } },
  });
  if (inventoryItem) return res.status(200).json({ type: "inventory", item: inventoryItem });

  const menuItem = await prisma.menuItem.findUnique({
    where: { userId_barcode: { userId: session.userId, barcode: code } },
    include: { ingredients: { include: { inventoryItem: true } } },
  });
  if (menuItem) return res.status(200).json({ type: "menu", item: menuItem });

  return res.status(404).json({ error: "Nessun articolo o prodotto associato a questo codice." });
}
