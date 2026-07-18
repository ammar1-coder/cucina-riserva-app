import { prisma } from "../../../lib/prisma";
import { getUserFromRequest } from "../../../lib/auth";

export default async function handler(req, res) {
  const session = getUserFromRequest(req);
  if (!session) return res.status(401).json({ error: "Non autenticato" });

  if (req.method === "GET") {
    const menuItems = await prisma.menuItem.findMany({
      where: { userId: session.userId },
      include: { ingredients: { include: { inventoryItem: true } } },
      orderBy: { createdAt: "desc" },
    });
    return res.status(200).json(menuItems);
  }

  if (req.method === "POST") {
    if (session.role === "staff") return res.status(403).json({ error: "Solo il titolare può creare nuove ricette." });
    const { name, barcode, ingredients } = req.body || {};
    if (!name || !Array.isArray(ingredients) || ingredients.length === 0) {
      return res.status(400).json({ error: "Aggiungi un nome e almeno un ingrediente." });
    }
    const cleanBarcode = barcode && String(barcode).trim() ? String(barcode).trim() : null;

    if (cleanBarcode) {
      const existing = await prisma.menuItem.findUnique({
        where: { userId_barcode: { userId: session.userId, barcode: cleanBarcode } },
      });
      if (existing) return res.status(409).json({ error: "Questo codice a barre è già associato a un altro prodotto." });
    }

    // Verifica che tutti gli ingredienti appartengano a questo utente
    const ids = ingredients.map((i) => i.inventoryItemId);
    const owned = await prisma.inventoryItem.findMany({ where: { id: { in: ids }, userId: session.userId } });
    if (owned.length !== ids.length) return res.status(400).json({ error: "Uno o più ingredienti non validi." });

    const menuItem = await prisma.menuItem.create({
      data: {
        name: String(name).trim(),
        barcode: cleanBarcode,
        userId: session.userId,
        ingredients: {
          create: ingredients.map((i) => ({
            inventoryItemId: i.inventoryItemId,
            quantityUsed: parseFloat(i.quantityUsed) || 0,
          })),
        },
      },
      include: { ingredients: { include: { inventoryItem: true } } },
    });
    return res.status(200).json(menuItem);
  }

  return res.status(405).json({ error: "Metodo non consentito" });
}
