import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Logo from "../components/Logo";

const PLANS = [
  { key: "essenziale", name: "Essenziale", price: "35", features: ["1 sede", "Fino a 150 articoli", "Avvisi scorte basse"] },
  { key: "riserva", name: "Riserva", price: "50", features: ["Articoli illimitati", "Ricette e scarico automatico", "Report mensili"], featured: true },
  { key: "tenuta", name: "Tenuta", price: "85", features: ["Fino a 5 sedi", "Gestione fornitori", "Supporto dedicato"] },
];

export default function Billing() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");
  const [busyPlan, setBusyPlan] = useState(null);
  const [pin, setPin] = useState("");
  const [pinMsg, setPinMsg] = useState("");

  useEffect(() => {
    (async () => {
      const meRes = await fetch("/api/auth/me");
      if (!meRes.ok) { router.push("/login"); return; }
      const me = await meRes.json();
      if (me.role === "staff") { router.push("/dashboard"); return; }
      setUser(me);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const choosePlan = async (planKey) => {
    setError("");
    setBusyPlan(planKey);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planKey }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Impossibile avviare il pagamento."); setBusyPlan(null); return; }
      window.location.href = data.url;
    } catch (e) {
      setError("Errore di rete.");
      setBusyPlan(null);
    }
  };

  const savePin = async () => {
    setPinMsg("");
    try {
      const res = await fetch("/api/auth/set-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      const data = await res.json();
      if (!res.ok) { setPinMsg(data.error || "Impossibile salvare il PIN."); return; }
      setPinMsg("PIN dello staff salvato. Lo staff può accedere da /staff-login con l'email del ristorante e questo PIN.");
      setPin("");
    } catch (e) {
      setPinMsg("Errore di rete.");
    }
  };

  if (!user) return <div className="loading-screen">Caricamento…</div>;

  return (
    <div>
      <header className="topnav">
        <div className="brand"><Logo size={22} /> Cucina <span>Riserva</span></div>
        <nav className="tabs">
          <span className="tab" onClick={() => router.push("/dashboard")}>Magazzino</span>
          <span className="tab" onClick={() => router.push("/fornitori")}>Fornitori</span>
          <span className="tab" onClick={() => router.push("/ricette")}>Ricette</span>
          <span className="tab" onClick={() => router.push("/report")}>Report</span>
        </nav>
      </header>
      <main className="content">
        <div className="pagehead">
          <div>
            <h1>Abbonamento</h1>
            <p>Stato attuale: {user.subscriptionStatus === "active" ? `attivo (${user.plan})` : "periodo di prova"}</p>
          </div>
        </div>
        {error && <div className="err" style={{ marginBottom: 20 }}>{error}</div>}
        <div className="plan-grid">
          {PLANS.map((p) => (
            <div className={`plan-card ${p.featured ? "featured" : ""}`} key={p.key}>
              {p.featured && <span className="plan-tag">Più scelto</span>}
              <h3>{p.name}</h3>
              <div className="plan-price"><span className="cur">€</span>{p.price}<span className="per">/mese</span></div>
              <ul>{p.features.map((f) => <li key={f}>{f}</li>)}</ul>
              <button className={p.featured ? "btn-gold" : "btn-outline"} disabled={busyPlan === p.key} onClick={() => choosePlan(p.key)}>
                <span>{busyPlan === p.key ? "Attendere…" : "Scegli questo piano"}</span>
              </button>
            </div>
          ))}
        </div>

        <h2 className="section-label" style={{ marginTop: 40 }}>Accesso staff</h2>
        <div className="alert-list" style={{ padding: 22, display: "block" }}>
          <p style={{ color: "#C4A3A8", fontSize: 13.5, marginBottom: 14 }}>
            Imposta un PIN per il tuo personale: potranno accedere da <code>/staff-login</code> con
            l'email del ristorante e questo PIN, senza vedere fatturazione, fornitori o ricette —
            solo registrare carichi, consumi e vendite.
          </p>
          <div className="row2" style={{ maxWidth: 320 }}>
            <input type="password" inputMode="numeric" placeholder="Nuovo PIN (4-6 cifre)" value={pin} onChange={(e) => setPin(e.target.value)} />
            <button className="btn-secondary" onClick={savePin}>Salva PIN</button>
          </div>
          {pinMsg && <p style={{ color: "#C9A227", fontSize: 13, marginTop: 10 }}>{pinMsg}</p>}
        </div>
      </main>
    </div>
  );
}
