import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Logo from "../components/Logo";

function fmtEuro(n) {
  return "€" + (n || 0).toFixed(2);
}

export default function Report() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const meRes = await fetch("/api/auth/me");
        if (!meRes.ok) { router.push("/login"); return; }
        setUser(await meRes.json());
        const repRes = await fetch("/api/reports");
        setData(await repRes.json());
      } catch (e) {
        setError("Impossibile contattare il server.");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!user || data === null) {
    return <div className="loading-screen">{error || "Caricamento report…"}</div>;
  }

  return (
    <div>
      <header className="topnav">
        <div className="brand"><Logo size={22} /> Cucina <span>Riserva</span></div>
        <nav className="tabs">
          <span className="tab" onClick={() => router.push("/dashboard")}>Magazzino</span>
          <span className="tab" onClick={() => router.push("/fornitori")}>Fornitori</span>
          <span className="tab" onClick={() => router.push("/ricette")}>Ricette</span>
          <span className="tab active">Report</span>
        </nav>
        <div className="nav-right">
          <span className="user-chip" title={user.email}>{user.restaurant.charAt(0).toUpperCase()}</span>
        </div>
      </header>

      <main className="content">
        <div className="pagehead">
          <div>
            <h1>Report</h1>
            <p>{user.restaurant} · ultimi 30 giorni</p>
          </div>
        </div>

        <div className="stats">
          <div className="stat"><span className="stat-label">Valore magazzino</span><span className="stat-value">{fmtEuro(data.inventoryValue)}</span></div>
          <div className="stat"><span className="stat-label">Sprechi (30gg)</span><span className="stat-value" style={{ color: "#C9707A" }}>{fmtEuro(data.wasteTotalCost)}</span></div>
          <div className="stat"><span className="stat-label">Eventi di spreco</span><span className="stat-value">{data.wasteEventsCount}</span></div>
          <div className="stat"><span className="stat-label">Prodotti in menu</span><span className="stat-value">{data.menuItemsCount}</span></div>
        </div>

        <h2 className="section-label">Articoli più sprecati</h2>
        {data.topWaste.length === 0 ? (
          <p className="section-sub" style={{ margin: "0 0 30px", textAlign: "left" }}>Nessuno spreco registrato negli ultimi 30 giorni.</p>
        ) : (
          <div className="alert-list" style={{ marginBottom: 34 }}>
            {data.topWaste.map((w) => (
              <div className="alert-row" key={w.name}>
                <span className="name">{w.name}</span>
                <span className="meta">{w.qty} unità sprecate</span>
              </div>
            ))}
          </div>
        )}

        <h2 className="section-label">Registro sprechi recenti</h2>
        {data.recentWaste.length === 0 ? (
          <p className="section-sub" style={{ margin: 0, textAlign: "left" }}>Ancora nessun evento registrato.</p>
        ) : (
          <div className="alert-list">
            {data.recentWaste.map((w) => (
              <div className="alert-row" key={w.id}>
                <span className="name">{w.name}</span>
                <span className="meta">{w.quantity} {w.unit} · {fmtEuro(w.cost)} {w.reason ? `· ${w.reason}` : ""}</span>
                <span className="meta">{new Date(w.date).toLocaleDateString("it-IT")}</span>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
