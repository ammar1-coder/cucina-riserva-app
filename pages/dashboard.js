import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import Logo from "../components/Logo";

const BarcodeScanner = dynamic(() => import("../components/BarcodeScanner"), { ssr: false });

const COLORS = { ok: "#0EA37A", low: "#DB8A17", out: "#E5484D" };

function statusOf(item) {
  if (item.qty <= 0) return "out";
  if (item.qty <= item.threshold) return "low";
  return "ok";
}
function fmtQty(n) {
  return Number.isInteger(n) ? String(n) : n.toFixed(1).replace(".0", "");
}

function Ring({ pct, color, size = 64, stroke = 6 }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#452630" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transition: "stroke-dashoffset .4s ease" }} />
    </svg>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [items, setItems] = useState(null);
  const [error, setError] = useState("");
  const [adjustTarget, setAdjustTarget] = useState(null);
  const [adjustValue, setAdjustValue] = useState("");
  const [adjustMode, setAdjustMode] = useState("add");
  const [isWaste, setIsWaste] = useState(false);
  const [wasteReason, setWasteReason] = useState("");
  const [showNewForm, setShowNewForm] = useState(false);
  const [newItem, setNewItem] = useState({ name: "", category: "", qty: "", unit: "kg", threshold: "", barcode: "" });
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerMode, setScannerMode] = useState("adjust"); // "adjust" | "new-item"

  // Verifica l'accesso e carica i dati reali dal database
  useEffect(() => {
    (async () => {
      try {
        const meRes = await fetch("/api/auth/me");
        if (!meRes.ok) { router.push("/login"); return; }
        const me = await meRes.json();
        setUser(me);

        const invRes = await fetch("/api/inventory");
        const inv = await invRes.json();
        setItems(inv);
      } catch (e) {
        setError("Impossibile contattare il server.");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  const openAdjust = (item, mode) => { setAdjustTarget(item); setAdjustMode(mode); setAdjustValue(""); setIsWaste(false); setWasteReason(""); };

  const confirmAdjust = async () => {
    const val = parseFloat(adjustValue);
    if (!adjustTarget || isNaN(val) || val <= 0) return;
    const delta = adjustMode === "add" ? val : -val;
    try {
      const res = await fetch(`/api/inventory/${adjustTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          delta,
          ...(adjustMode === "remove" && isWaste ? { waste: true, wasteReason: wasteReason || null } : {}),
        }),
      });
      const updated = await res.json();
      if (res.ok) {
        setItems((prev) => prev.map((it) => (it.id === updated.id ? updated : it)));
      } else {
        setError(updated.error || "Aggiornamento non riuscito.");
      }
    } catch (e) {
      setError("Errore di rete durante l'aggiornamento.");
    }
    setAdjustTarget(null);
    setAdjustValue("");
    setIsWaste(false);
    setWasteReason("");
  };

  const addNewItem = async () => {
    if (!newItem.name.trim() || newItem.qty === "" || newItem.threshold === "") return;
    try {
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newItem),
      });
      const created = await res.json();
      if (res.ok) {
        setItems((prev) => [created, ...prev]);
        setNewItem({ name: "", category: "", qty: "", unit: "kg", threshold: "", barcode: "" });
        setShowNewForm(false);
      } else {
        setError(created.error || "Aggiunta non riuscita.");
      }
    } catch (e) {
      setError("Errore di rete durante l'aggiunta.");
    }
  };

  const openScanner = (mode) => { setScannerMode(mode); setScannerOpen(true); };

  const handleScan = async (code) => {
    setScannerOpen(false);
    if (scannerMode === "new-item") {
      setNewItem((f) => ({ ...f, barcode: code }));
      return;
    }
    // modalità "adjust": cerca l'articolo tramite il codice e apri subito la finestra di carico/consumo
    try {
      const res = await fetch(`/api/inventory/barcode/${encodeURIComponent(code)}`);
      const data = await res.json();
      if (!res.ok) {
        setError(`Nessun articolo di magazzino trovato per il codice ${code}. Puoi collegarlo da "+ Nuovo articolo".`);
        return;
      }
      if (data.type === "inventory") {
        openAdjust(data.item, "remove"); // scansione in cucina = di norma un consumo
      } else {
        setError(`Questo codice appartiene al prodotto "${data.item.name}" del menu — usa "Scansiona per vendere" nella pagina Ricette.`);
      }
    } catch (e) {
      setError("Errore di rete durante la ricerca del codice.");
    }
  };

  if (!user || items === null) {
    return <div className="loading-screen">{error || "Caricamento magazzino…"}</div>;
  }

  const totalItems = items.length;
  const lowCount = items.filter((i) => statusOf(i) === "low").length;
  const outCount = items.filter((i) => statusOf(i) === "out").length;
  const reorderList = items.filter((i) => statusOf(i) !== "ok").sort((a, b) => (statusOf(a) === "out" ? -1 : 1));

  return (
    <div>
      <header className="topnav">
        <div className="brand"><Logo size={22} /> Cucina <span>Riserva</span></div>
        <nav className="tabs">
          <span className="tab active">Magazzino</span>
          <span className="tab" onClick={() => router.push("/fornitori")}>Fornitori</span>
          <span className="tab" onClick={() => router.push("/ricette")}>Ricette</span>
          <span className="tab" onClick={() => router.push("/report")}>Report</span>
        </nav>
        <div className="nav-right">
          <span className="user-chip" title={user.email}>{user.restaurant.charAt(0).toUpperCase()}</span>
          {user.role !== "staff" && <button className="btn-ghost sm" onClick={() => router.push("/billing")}>Abbonamento</button>}
          <button className="btn-ghost sm" onClick={logout}>Esci</button>
        </div>
      </header>

      <main className="content">
        <div className="pagehead">
          <div>
            <h1>Magazzino</h1>
            <p>{user.restaurant}{user.role === "staff" && <span className="staff-badge"> · Accesso staff</span>}</p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn-ghost" onClick={() => openScanner("adjust")}>📷 Scansiona</button>
            {user.role !== "staff" && <button className="btn-secondary" onClick={() => setShowNewForm(true)}>+ Nuovo articolo</button>}
          </div>
        </div>

        <div className="stats">
          <div className="stat"><span className="stat-label">Articoli totali</span><span className="stat-value">{totalItems}</span></div>
          <div className="stat"><span className="stat-label" style={{ color: COLORS.low }}>Scorte basse</span><span className="stat-value" style={{ color: COLORS.low }}>{lowCount}</span></div>
          <div className="stat"><span className="stat-label" style={{ color: COLORS.out }}>Esauriti</span><span className="stat-value" style={{ color: COLORS.out }}>{outCount}</span></div>
          <div className="stat"><span className="stat-label">Da riordinare</span><span className="stat-value">{lowCount + outCount}</span></div>
        </div>

        {reorderList.length > 0 && (
          <section>
            <h2 className="section-label">Da riordinare</h2>
            <div className="alert-list">
              {reorderList.map((it) => (
                <div className="alert-row" key={it.id}>
                  <span className="dot" style={{ background: COLORS[statusOf(it)] }} />
                  <span className="name">{it.name}</span>
                  <span className="meta">{fmtQty(it.qty)} {it.unit} rimasti</span>
                  <button className="btn-ghost sm" onClick={() => openAdjust(it, "add")}>Registra carico</button>
                </div>
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="section-label" style={{ marginTop: 32 }}>Inventario</h2>
          {items.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">◈</span>
              <h3>Il tuo magazzino è vuoto</h3>
              <p>Aggiungi il primo articolo per iniziare a tenere traccia delle scorte.</p>
              <button className="btn-secondary" onClick={() => setShowNewForm(true)}>+ Aggiungi il primo articolo</button>
            </div>
          ) : (
            <div className="grid">
              {items.map((it) => {
                const st = statusOf(it);
                const pct = Math.min(100, Math.round((it.qty / (it.capacity || it.qty || 1)) * 100));
                return (
                  <div className="card" key={it.id}>
                    <div className="card-top">
                      <Ring pct={pct} color={COLORS[st]} />
                      <div className="ring-label">
                        <span className="qty">{fmtQty(it.qty)}</span>
                        <span className="unit">{it.unit}</span>
                      </div>
                    </div>
                    <div className="card-name">{it.name}</div>
                    <div className="card-cat">{it.category}</div>
                    <span className={`badge ${st}`}>{st === "ok" ? "In stock" : st === "low" ? "Scorta bassa" : "Esaurito"}</span>
                    <div className="card-actions">
                      <button onClick={() => openAdjust(it, "add")}>+ Carico</button>
                      <button onClick={() => openAdjust(it, "remove")}>− Consumo</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {adjustTarget && (
        <div className="overlay" onClick={() => setAdjustTarget(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{adjustMode === "add" ? "Registra carico" : "Registra consumo"}</h3>
            <p className="modal-sub">{adjustTarget.name} · attuale {fmtQty(adjustTarget.qty)} {adjustTarget.unit}</p>
            <input autoFocus type="number" min="0" step="0.1" placeholder={`Quantità in ${adjustTarget.unit}`}
              value={adjustValue} onChange={(e) => setAdjustValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && confirmAdjust()} />
            {adjustMode === "remove" && (
              <label className="waste-check">
                <input type="checkbox" checked={isWaste} onChange={(e) => setIsWaste(e.target.checked)} />
                <span>Segna come spreco (non una vendita)</span>
              </label>
            )}
            {adjustMode === "remove" && isWaste && (
              <select value={wasteReason} onChange={(e) => setWasteReason(e.target.value)} style={{ marginBottom: 14 }}>
                <option value="">Motivo (opzionale)</option>
                <option value="Scaduto">Scaduto</option>
                <option value="Rotto/danneggiato">Rotto/danneggiato</option>
                <option value="Errore in cucina">Errore in cucina</option>
                <option value="Altro">Altro</option>
              </select>
            )}
            <div className="modal-actions">
              <button className="btn-ghost" onClick={() => setAdjustTarget(null)}>Annulla</button>
              <button className="btn-secondary" onClick={confirmAdjust}>Conferma</button>
            </div>
          </div>
        </div>
      )}

      {showNewForm && (
        <div className="overlay" onClick={() => setShowNewForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Nuovo articolo</h3>
            <input placeholder="Nome articolo" value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} />
            <input placeholder="Categoria" value={newItem.category} onChange={(e) => setNewItem({ ...newItem, category: e.target.value })} />
            <div className="row2">
              <input type="number" min="0" step="0.1" placeholder="Quantità" value={newItem.qty} onChange={(e) => setNewItem({ ...newItem, qty: e.target.value })} />
              <select value={newItem.unit} onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}>
                <option value="kg">kg</option><option value="g">g</option><option value="L">L</option><option value="pz">pz</option><option value="mazzi">mazzi</option>
              </select>
            </div>
            <input type="number" min="0" step="0.1" placeholder="Soglia minima" value={newItem.threshold} onChange={(e) => setNewItem({ ...newItem, threshold: e.target.value })} />
            <input type="number" min="0" step="0.01" placeholder="Costo per unità in € (opzionale, per i report)" value={newItem.unitCost || ""} onChange={(e) => setNewItem({ ...newItem, unitCost: e.target.value })} />
            <div className="row2">
              <input placeholder="Codice a barre (opzionale)" value={newItem.barcode} onChange={(e) => setNewItem({ ...newItem, barcode: e.target.value })} />
              <button type="button" className="btn-ghost" onClick={() => openScanner("new-item")}>📷</button>
            </div>
            <div className="modal-actions">
              <button className="btn-ghost" onClick={() => setShowNewForm(false)}>Annulla</button>
              <button className="btn-secondary" onClick={addNewItem}>Aggiungi</button>
            </div>
          </div>
        </div>
      )}

      {scannerOpen && (
        <BarcodeScanner onDetected={handleScan} onClose={() => setScannerOpen(false)} />
      )}
    </div>
  );
}
