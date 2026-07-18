import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Logo from "../components/Logo";

export default function Register() {
  const router = useRouter();
  const [restaurant, setRestaurant] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setError("");
    if (!restaurant.trim() || !email.trim() || !password.trim()) {
      setError("Compila tutti i campi.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restaurant, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Registrazione non riuscita.");
        setBusy(false);
        return;
      }
      router.push("/dashboard");
    } catch (e) {
      setError("Errore di rete. Controlla la connessione e riprova.");
      setBusy(false);
    }
  };

  return (
    <div className="login-in">
      <div className="login-card">
        <Logo size={40} />
        <h2>Crea il tuo account</h2>
        <p className="sub">Registra il tuo ristorante su Cucina Riserva</p>

        <label>Nome ristorante</label>
        <input placeholder="Trattoria del Borgo" value={restaurant} onChange={(e) => setRestaurant(e.target.value)} />

        <label>Email</label>
        <input type="email" placeholder="nome@ristorante.it" value={email}
          onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} />

        <label>Password</label>
        <input type="password" placeholder="Almeno 6 caratteri" value={password}
          onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} />

        {error && <div className="err">{error}</div>}

        <button className="btn-primary" onClick={submit} disabled={busy}>
          {busy ? "Attendere…" : "Registrati"}
        </button>

        <div className="alt-row">
          <span>Hai già un account?</span>
          <Link href="/login">Accedi</Link>
        </div>
      </div>
    </div>
  );
}
