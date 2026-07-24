import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import Logo from "../components/Logo";

const BarcodeScanner = dynamic(() => import("../components/BarcodeScanner"), { ssr: false });

export default function Ricette() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [menuItems, setMenuItems] = useState(null);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const [showNewForm, setShowNewForm] = useState(false);
  const [form, setForm] = useState({ name: "", barcode: "", rows: [{ inventoryItemId: "", quantityUsed: "" }] });
  const [scannerFor, setScannerFor] = useState(null); // "new-product" | "sell"

  useEffect(() => {
    (async () => {
      try {
        const meRes = await fetch("/api/auth/me");
        if (!meRes.ok) { router.push("/login"); return; }
        setUser(await meRes.json());

        const [menuRes, invRes] = await Promise.all([fetch("/api/menu"), fetch("/api/inventory")]);
        setMenuItems(await menuRes.json());
        setInventoryItems(await invRes.json());
      } catch (e) {
        setError("Impossibile contattare il server.");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addRow = () => setForm((f) => ({ ...f, rows: [...f.rows, { inventoryItemId: "", quantityUsed: "" }] }));
  const updateRow = (i, key, val) => setForm((f) => {
    const rows = [...f.rows];
    rows[i] = { ...rows[i], [key]: val };
    return { ...f, rows };
  });
  const removeRow = (i) => setForm((f) => ({ ...f, rows: f.rows.filter((_, idx) => idx !== i) }));

  const createMenuItem = async () => {
    setError("");
    const ingredients = form.rows.filter((r) => r.inventoryItemId && r.quantityUsed !== "");
    if (!form.name.trim() || ingredients.length === 0) {
      setError("Dai un nome al prodotto e collega almeno un ingrediente.");
      return;
    }
    try {
      const res = await fetch("/api/menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, barcode: form.barcode, ingredients }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Creazione non riuscita."); return; }
      setMenuItems((prev) => [data, ...prev]);
      setForm({ name: "", barcode: "", rows: [{ inventoryItemId: "", quantityUsed: "" }] });
      setShowNewForm(false);
    } catch (e) {
      setError("Errore di rete.");
    }
  };

  const sell = async (menuItemId, name) => {
    try {
      const res = await fetch("/api/menu/sell", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ menuItemId, quantity: 1 }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Operazione non riuscita."); return; }
      setToast(`Venduto: ${name} — magazzino aggiornato automaticamente`);
      setTimeout(() => setToast(""), 2500);
      const invRes = await fetch("/api/inventory");
      setInventoryItems(await invRes.json());
    } catch (e) {
      setError("Errore di rete durante la vendita.");
    }
  };

  const handleScan = async (code) => {
    if (scannerFor === "new-product") {
      setForm((f) => ({ ...f, barcode: code }));
      setScannerFor(null);
      return;
    }
    if (scannerFor === "sell") {
      setScannerFor(null);
      try {
        const res = await fetch(`/api/inventory/barcode/${encodeURIComponent(code)}`);
        const data = await res.json();
        if (!res.ok) { setError(data.error || "Codice non riconosciuto."); return; }
        if (data.type === "menu") {
          sell(data.item.id, data.item.name);
        } else {
          setError(`"${data.item.name}" è un articolo di magazzino, non un prodotto venduto. Usa la scansione dalla pagina Magazzino per registrare un carico o consumo diretto.`);
        }
      } catch (e) {
        setError("Errore di rete durante la ricerca del codice.");
      }
    }
  };

  if (!user || menuItems === null) {
    return <div className="loading-screen">{error || "Caricamento ricette…"}</div>;
  }

  return (
    <div>
      <header className="topnav">
        <div className="brand"><Logo size={22} /> Scorta <span>Riserva</span></div>
        <nav className="tabs">
          <span className="tab" onClick={() => router.push("/dashboard")}>Magazzino</span>
          <span className="tab" onClick={() => router.push("/fornitori")}>Fornitori</span>
          <span className="tab active">Ricette</span>
          <span className="tab" onClick={() => router.push("/report")}>Report</span>
        </nav>
        <div className="nav-right">
          <span className="user-chip" title={user.email}>{user.restaurant.charAt(0).toUpperCase()}</span>
        </div>
      </header>

      <main className="content">
        <div className="pagehead">
          <div>
            <h1>Ricette</h1>
            <p>Collega i tuoi prodotti agli ingredienti — la vendita scala il magazzino da sola</p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn-ghost" onClick={() => setScannerFor("sell")}>📷 Scansiona per vendere</button>
            {user.role !== "staff" && <button className="btn-secondary" onClick={() => setShowNewForm(true)}>+ Nuovo prodotto</button>}
          </div>
        </div>

        {toast && <div className="toast">{toast}</div>}
        {error && <div className="err" style={{ marginBottom: 16 }}>{error}</div>}

        {menuItems.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">◈</span>
            <h3>Nessun prodotto collegato ancora</h3>
            <p>Crea il tuo primo prodotto (es. "Piadina Kebab") e collegalo agli ingredienti del magazzino.</p>
            <button className="btn-secondary" onClick={() => setShowNewForm(true)}>+ Crea il primo prodotto</button>
          </div>
        ) : (
          <div className="grid">
            {menuItems.map((m) => (
              <div className="card recipe-card" key={m.id}>
                <div className="card-name">{m.name}</div>
                {m.barcode && <div className="card-cat">Codice: {m.barcode}</div>}
                <ul className="ing-list">
                  {m.ingredients.map((ing) => (
                    <li key={ing.id}>{ing.inventoryItem.name} — {ing.quantityUsed} {ing.inventoryItem.unit}</li>
                  ))}
                </ul>
                <button className="btn-secondary" style={{ marginTop: 10 }} onClick={() => sell(m.id, m.name)}>
                  Vendi 1 — scala automaticamente
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      {showNewForm && (
        <div className="overlay" onClick={() => setShowNewForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Nuovo prodotto</h3>
            <input placeholder="Nome prodotto (es. Piadina Kebab)" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <div className="row2">
              <input placeholder="Codice a barre (opzionale)" value={form.barcode}
                onChange={(e) => setForm({ ...form, barcode: e.target.value })} />
              <button type="button" className="btn-ghost" onClick={() => setScannerFor("new-product")}>📷</button>
            </div>

            <p className="modal-sub" style={{ marginTop: 6 }}>Ingredienti usati per 1 unità:</p>
            {form.rows.map((row, i) => (
              <div className="row2" key={i}>
                <select value={row.inventoryItemId} onChange={(e) => updateRow(i, "inventoryItemId", e.target.value)}>
                  <option value="">Seleziona ingrediente…</option>
                  {inventoryItems.map((it) => (
                    <option key={it.id} value={it.id}>{it.name} ({it.unit})</option>
                  ))}
                </select>
                <input type="number" min="0" step="0.01" placeholder="Quantità" value={row.quantityUsed}
                  onChange={(e) => updateRow(i, "quantityUsed", e.target.value)} />
                {form.rows.length > 1 && (
                  <button type="button" className="btn-ghost sm" onClick={() => removeRow(i)}>✕</button>
                )}
              </div>
            ))}
            <button type="button" className="btn-ghost sm" onClick={addRow} style={{ marginBottom: 14 }}>+ Aggiungi ingrediente</button>

            {error && <div className="err">{error}</div>}
            <div className="modal-actions">
              <button className="btn-ghost" onClick={() => setShowNewForm(false)}>Annulla</button>
              <button className="btn-secondary" onClick={createMenuItem}>Salva prodotto</button>
            </div>
          </div>
        </div>
      )}

      {scannerFor && (
        <BarcodeScanner onDetected={handleScan} onClose={() => setScannerFor(null)} />
      )}
    </div>
  );
}
