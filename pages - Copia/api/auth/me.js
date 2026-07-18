import { prisma } from "../../../lib/prisma";
import { getUserFromRequest } from "../../../lib/auth";

export default async function handler(req, res) {
  const session = getUserFromRequest(req);
  if (!session) return res.status(401).json({ error: "Non autenticato" });

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) return res.status(401).json({ error: "Non autenticato" });

  return res.status(200).json({
    email: user.email,
    restaurant: user.restaurant,
    role: session.role || "owner",
    subscriptionStatus: user.subscriptionStatus,
    plan: user.plan,
  });
}
