import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Logo from "../components/Logo";

export default function StaffLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setError("");
    if (!email.trim() || !pin.trim()) { setError("Inserisci email del ristorante e PIN."); return; }
    setBusy(true);
    try {
      const res = await fetch("/api/auth/staff-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, pin }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Accesso non riuscito."); setBusy(false); return; }
      router.push("/dashboard");
    } catch (e) {
      setError("Errore di rete. Riprova.");
      setBusy(false);
    }
  };

  return (
    <div className="login-in">
      <div className="login-card">
        <Logo size={40} />
        <h2>Accesso staff</h2>
        <p className="sub">Inserisci l'email del ristorante e il PIN fornito dal titolare</p>

        <label>Email del ristorante</label>
        <input type="email" placeholder="nome@ristorante.it" value={email}
          onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} />

        <label>PIN</label>
        <input type="password" inputMode="numeric" placeholder="••••" value={pin}
          onChange={(e) => setPin(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} />

        {error && <div className="err">{error}</div>}

        <button className="btn-primary" onClick={submit} disabled={busy}>
          {busy ? "Attendere…" : "Entra"}
        </button>

        <div className="alt-row">
          <span>Sei il titolare?</span>
          <Link href="/login">Accedi con email e password</Link>
        </div>
      </div>
    </div>
  );
}
