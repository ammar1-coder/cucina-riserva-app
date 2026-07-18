import { prisma } from "../../../lib/prisma";
import { getUserFromRequest } from "../../../lib/auth";
import { stripe, PRICE_IDS } from "../../../lib/stripe";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Metodo non consentito" });

  if (!stripe) {
    return res.status(503).json({
      error: "Stripe non è configurato. Aggiungi STRIPE_SECRET_KEY e gli ID prezzo nel file .env (vedi README, sezione Pagamenti).",
    });
  }

  const session = getUserFromRequest(req);
  if (!session) return res.status(401).json({ error: "Non autenticato" });
  if (session.role === "staff") return res.status(403).json({ error: "Solo il titolare può gestire l'abbonamento." });

  const { plan } = req.body || {};
  const priceId = PRICE_IDS[plan];
  if (!priceId) return res.status(400).json({ error: "Piano non valido o ID prezzo mancante in .env." });

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) return res.status(401).json({ error: "Non autenticato" });

  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({ email: user.email, name: user.restaurant });
    customerId = customer.id;
    await prisma.user.update({ where: { id: user.id }, data: { stripeCustomerId: customerId } });
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `https://${req.headers.host}`;

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    subscription_data: { trial_period_days: 14 },
    success_url: `${baseUrl}/dashboard?checkout=success`,
    cancel_url: `${baseUrl}/billing?checkout=cancel`,
    metadata: { userId: user.id, plan },
  });

  return res.status(200).json({ url: checkoutSession.url });
}
