import { prisma } from "../../lib/prisma";
import { getUserFromRequest } from "../../lib/auth";

export default async function handler(req, res) {
  const session = getUserFromRequest(req);
  if (!session) return res.status(401).json({ error: "Non autenticato" });
  if (req.method !== "GET") return res.status(405).json({ error: "Metodo non consentito" });

  const items = await prisma.inventoryItem.findMany({ where: { userId: session.userId } });
  const inventoryValue = items.reduce((sum, it) => sum + it.qty * (it.unitCost || 0), 0);
  const lowCount = items.filter((it) => it.qty > 0 && it.qty <= it.threshold).length;
  const outCount = items.filter((it) => it.qty <= 0).length;

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const wasteLogs = await prisma.wasteLog.findMany({
    where: { userId: session.userId, createdAt: { gte: thirtyDaysAgo } },
    include: { inventoryItem: true },
    orderBy: { createdAt: "desc" },
  });
  const wasteTotalCost = wasteLogs.reduce((sum, w) => sum + w.estimatedCost, 0);

  // Aggrega lo spreco per articolo per trovare i più problematici
  const wasteByItem = {};
  wasteLogs.forEach((w) => {
    const key = w.inventoryItem.name;
    wasteByItem[key] = (wasteByItem[key] || 0) + w.quantity;
  });
  const topWaste = Object.entries(wasteByItem)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, qty]) => ({ name, qty }));

  const menuItems = await prisma.menuItem.findMany({ where: { userId: session.userId } });

  return res.status(200).json({
    inventoryValue,
    totalItems: items.length,
    lowCount,
    outCount,
    wasteTotalCost,
    wasteEventsCount: wasteLogs.length,
    topWaste,
    menuItemsCount: menuItems.length,
    recentWaste: wasteLogs.slice(0, 8).map((w) => ({
      id: w.id, name: w.inventoryItem.name, quantity: w.quantity, unit: w.inventoryItem.unit,
      cost: w.estimatedCost, reason: w.reason, date: w.createdAt,
    })),
  });
}
