import Stripe from "stripe";

// Richiede la tua chiave segreta Stripe in .env (STRIPE_SECRET_KEY).
// Senza questa chiave, le route /api/stripe/* risponderanno con un errore
// chiaro invece di bloccare l'intero sito.
export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" })
  : null;

export const PRICE_IDS = {
  essenziale: process.env.STRIPE_PRICE_ESSENZIALE,
  riserva: process.env.STRIPE_PRICE_RISERVA,
  tenuta: process.env.STRIPE_PRICE_TENUTA,
};
