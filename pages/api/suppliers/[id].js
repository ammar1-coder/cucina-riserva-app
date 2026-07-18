import { prisma } from "../../../lib/prisma";
import { getUserFromRequest } from "../../../lib/auth";

export default async function handler(req, res) {
  const session = getUserFromRequest(req);
  if (!session) return res.status(401).json({ error: "Non autenticato" });

  const { id } = req.query;
  const supplier = await prisma.supplier.findUnique({ where: { id } });
  if (!supplier || supplier.userId !== session.userId) {
    return res.status(404).json({ error: "Fornitore non trovato." });
  }

  if (req.method === "DELETE") {
    await prisma.inventoryItem.updateMany({ where: { supplierId: id }, data: { supplierId: null } });
    await prisma.supplier.delete({ where: { id } });
    return res.status(200).json({ ok: true });
  }

  if (req.method === "PATCH") {
    const { name, phone, email, notes } = req.body || {};
    const updated = await prisma.supplier.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name: name.trim() } : {}),
        ...(phone !== undefined ? { phone } : {}),
        ...(email !== undefined ? { email } : {}),
        ...(notes !== undefined ? { notes } : {}),
      },
    });
    return res.status(200).json(updated);
  }

  return res.status(405).json({ error: "Metodo non consentito" });
}
