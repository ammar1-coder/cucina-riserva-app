import { prisma } from "../../../lib/prisma";
import { getUserFromRequest } from "../../../lib/auth";
import { sendLowStockEmail } from "../../../lib/notify";

export default async function handler(req, res) {
  const session = getUserFromRequest(req);
  if (!session) return res.status(401).json({ error: "Non autenticato" });
  if (req.method !== "POST") return res.status(405).json({ error: "Metodo non consentito" });

  const { menuItemId, quantity } = req.body || {};
  const qty = parseFloat(quantity) || 1;
  if (!menuItemId || qty <= 0) return res.status(400).json({ error: "Dati non validi." });

  const menuItem = await prisma.menuItem.findUnique({
    where: { id: menuItemId },
    include: { ingredients: { include: { inventoryItem: true } } },
  });
  if (!menuItem || menuItem.userId !== session.userId) {
    return res.status(404).json({ error: "Prodotto non trovato." });
  }

  // Scala ogni ingrediente collegato, senza andare sotto zero.
  const updates = await prisma.$transaction(
    menuItem.ingredients.map((ing) =>
      prisma.inventoryItem.update({
        where: { id: ing.inventoryItemId },
        data: {
          qty: Math.max(0, ing.inventoryItem.qty - ing.quantityUsed * qty),
        },
      })
    )
  );

  // Avvisa via email per ogni ingrediente appena sceso alla soglia minima o sotto.
  const owner = await prisma.user.findUnique({ where: { id: session.userId } });
  if (owner) {
    updates.forEach((updatedItem, i) => {
      const before = menuItem.ingredients[i].inventoryItem;
      if (before.qty > before.threshold && updatedItem.qty <= updatedItem.threshold) {
        sendLowStockEmail({ to: owner.email, restaurant: owner.restaurant, item: updatedItem }).catch(() => {});
      }
    });
  }

  return res.status(200).json({ ok: true, updatedItems: updates });
}
