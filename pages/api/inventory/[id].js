import { prisma } from "../../../lib/prisma";
import { getUserFromRequest } from "../../../lib/auth";
import { sendLowStockEmail } from "../../../lib/notify";

export default async function handler(req, res) {
  const session = getUserFromRequest(req);
  if (!session) return res.status(401).json({ error: "Non autenticato" });

  const { id } = req.query;

  // Verifica che l'articolo appartenga a questo utente (mai fidarsi solo del client).
  const item = await prisma.inventoryItem.findUnique({ where: { id } });
  if (!item || item.userId !== session.userId) {
    return res.status(404).json({ error: "Articolo non trovato." });
  }

  if (req.method === "PATCH") {
    const { delta, waste, wasteReason, supplierId, unitCost } = req.body || {};

    if (supplierId !== undefined || unitCost !== undefined) {
      const updated = await prisma.inventoryItem.update({
        where: { id },
        data: {
          ...(supplierId !== undefined ? { supplierId: supplierId || null } : {}),
          ...(unitCost !== undefined ? { unitCost: parseFloat(unitCost) || 0 } : {}),
        },
      });
      return res.status(200).json(updated);
    }

    if (typeof delta !== "number") {
      return res.status(400).json({ error: "Valore non valido." });
    }
    const newQty = Math.max(0, item.qty + delta);
    const updated = await prisma.inventoryItem.update({
      where: { id },
      data: { qty: newQty },
    });

    // Se la diminuzione è marcata come spreco, la registriamo separatamente per i report.
    if (waste && delta < 0) {
      await prisma.wasteLog.create({
        data: {
          quantity: Math.abs(delta),
          estimatedCost: Math.abs(delta) * (item.unitCost || 0),
          reason: wasteReason || null,
          userId: session.userId,
          inventoryItemId: id,
        },
      });
    }

    // Se la quantità è appena scesa alla soglia minima o sotto, avvisa via email
    // (non blocca la risposta: l'avviso parte in background).
    const wasAboveThreshold = item.qty > item.threshold;
    const nowAtOrBelow = newQty <= item.threshold;
    if (wasAboveThreshold && nowAtOrBelow) {
      const owner = await prisma.user.findUnique({ where: { id: session.userId } });
      if (owner) {
        sendLowStockEmail({ to: owner.email, restaurant: owner.restaurant, item: updated }).catch(() => {});
      }
    }

    return res.status(200).json(updated);
  }

  if (req.method === "DELETE") {
    if (session.role === "staff") return res.status(403).json({ error: "Solo il titolare può eliminare articoli." });
    await prisma.inventoryItem.delete({ where: { id } });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: "Metodo non consentito" });
}
