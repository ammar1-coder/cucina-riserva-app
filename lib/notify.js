// Invia un'email di avviso quando un articolo scende sotto la soglia minima.
// Richiede RESEND_API_KEY nel file .env (account gratuito su https://resend.com).
// Se la chiave non è configurata, la funzione non fa nulla — non blocca mai
// il resto dell'app.

export async function sendLowStockEmail({ to, restaurant, item }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { skipped: true };

  const from = process.env.NOTIFY_FROM_EMAIL || "avvisi@tuodominio.it";
  const subject =
    item.qty <= 0
      ? `⚠️ ${item.name} esaurito — ${restaurant}`
      : `⚠️ Scorta bassa: ${item.name} — ${restaurant}`;

  const body = item.qty <= 0
    ? `L'articolo "${item.name}" risulta esaurito nel magazzino di ${restaurant}.`
    : `L'articolo "${item.name}" è sceso a ${item.qty} ${item.unit}, sotto la soglia minima di ${item.threshold} ${item.unit}, nel magazzino di ${restaurant}.`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to,
        subject,
        text: body,
      }),
    });
    if (!res.ok) {
      const errText = await res.text();
      console.error("Invio email fallito:", errText);
      return { skipped: false, ok: false };
    }
    return { skipped: false, ok: true };
  } catch (e) {
    console.error("Errore di rete nell'invio email:", e);
    return { skipped: false, ok: false };
  }
}
