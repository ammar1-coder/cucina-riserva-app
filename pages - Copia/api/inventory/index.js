import { prisma } from "../../../lib/prisma";
import { getUserFromRequest } from "../../../lib/auth";

export default async function handler(req, res) {
  const session = getUserFromRequest(req);
  if (!session) return res.status(401).json({ error: "Non autenticato" });

  if (req.method === "GET") {
    const items = await prisma.inventoryItem.findMany({
      where: { userId: session.userId },
      orderBy: { updatedAt: "desc" },
    });
    return res.status(200).json(items);
  }

  if (req.method === "POST") {
    const { name, category, qty, unit, threshold, barcode, scanDeduct, unitCost, supplierId } = req.body || {};
    if (!name || qty === undefined || threshold === undefined) {
      return res.status(400).json({ error: "Dati mancanti." });
    }
    const cleanBarcode = barcode && String(barcode).trim() ? String(barcode).trim() : null;
    if (cleanBarcode) {
      const existing = await prisma.inventoryItem.findUnique({
        where: { userId_barcode: { userId: session.userId, barcode: cleanBarcode } },
      });
      if (existing) return res.status(409).json({ error: "Questo codice a barre è già associato a un altro articolo." });
    }
    const item = await prisma.inventoryItem.create({
      data: {
        name: String(name).trim(),
        category: (category && String(category).trim()) || "Generico",
        qty: parseFloat(qty) || 0,
        unit: unit || "kg",
        threshold: parseFloat(threshold) || 0,
        capacity: Math.max(parseFloat(qty) || 10, (parseFloat(threshold) || 1) * 3),
        barcode: cleanBarcode,
        scanDeduct: parseFloat(scanDeduct) || 1,
        unitCost: parseFloat(unitCost) || 0,
        supplierId: supplierId || null,
        userId: session.userId,
      },
    });
    return res.status(200).json(item);
  }

  return res.status(405).json({ error: "Metodo non consentito" });
}
