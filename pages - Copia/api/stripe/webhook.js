import { buffer } from "micro";
import { prisma } from "../../../lib/prisma";
import { stripe } from "../../../lib/stripe";

// I webhook Stripe richiedono il corpo "grezzo" della richiesta per verificare la firma.
export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  if (!stripe) return res.status(503).json({ error: "Stripe non configurato." });

  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  let event;

  try {
    const rawBody = await buffer(req);
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    return res.status(400).json({ error: `Firma webhook non valida: ${err.message}` });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      if (session.metadata?.userId) {
        await prisma.user.update({
          where: { id: session.metadata.userId },
          data: { subscriptionStatus: "active", plan: session.metadata.plan || null },
        });
      }
      break;
    }
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const sub = event.data.object;
      const user = await prisma.user.findFirst({ where: { stripeCustomerId: sub.customer } });
      if (user) {
        await prisma.user.update({
          where: { id: user.id },
          data: { subscriptionStatus: sub.status === "active" ? "active" : sub.status },
        });
      }
      break;
    }
    default:
      break; // altri eventi ignorati
  }

  return res.status(200).json({ received: true });
}
