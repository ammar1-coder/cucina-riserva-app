import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Logo from "../components/Logo";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setError("");
    if (!email.trim() || !password.trim()) {
      setError("Inserisci email e password.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Accesso non riuscito.");
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
        <h2>Bentornato</h2>
        <p className="sub">Accedi al magazzino del tuo ristorante</p>

        <label>Email</label>
        <input type="email" placeholder="nome@ristorante.it" value={email}
          onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} />

        <label>Password</label>
        <input type="password" placeholder="••••••••" value={password}
          onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} />

        {error && <div className="err">{error}</div>}

        <button className="btn-primary" onClick={submit} disabled={busy}>
          {busy ? "Attendere…" : "Accedi"}
        </button>

        <div className="alt-row">
          <span>Non hai un account?</span>
          <Link href="/register">Registrati</Link>
        </div>
        <div className="alt-row">
          <span>Sei un membro dello staff?</span>
          <Link href="/staff-login">Accesso staff</Link>
        </div>
      </div>
    </div>
  );
}
