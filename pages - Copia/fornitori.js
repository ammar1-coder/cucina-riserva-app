import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Logo from "../components/Logo";

export default function Fornitori() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [suppliers, setSuppliers] = useState(null);
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "", notes: "" });

  useEffect(() => {
    (async () => {
      try {
        const meRes = await fetch("/api/auth/me");
        if (!meRes.ok) { router.push("/login"); return; }
        setUser(await meRes.json());
        const [supRes, invRes] = await Promise.all([fetch("/api/suppliers"), fetch("/api/inventory")]);
        setSuppliers(await supRes.json());
        setItems(await invRes.json());
      } catch (e) {
        setError("Impossibile contattare il server.");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createSupplier = async () => {
    if (!form.name.trim()) { setError("Il nome del fornitore è obbligatorio."); return; }
    try {
      const res = await fetch("/api/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Creazione non riuscita."); return; }
      setSuppliers((prev) => [...prev, { ...data, items: [] }]);
      setForm({ name: "", phone: "", email: "", notes: "" });
      setShowForm(false);
    } catch (e) {
      setError("Errore di rete.");
    }
  };

  const linkItem = async (itemId, supplierId) => {
    try {
      await fetch(`/api/inventory/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ supplierId: supplierId || null }),
      });
      const [supRes, invRes] = await Promise.all([fetch("/api/suppliers"), fetch("/api/inventory")]);
      setSuppliers(await supRes.json());
      setItems(await invRes.json());
    } catch (e) {
      setError("Errore durante il collegamento.");
    }
  };

  if (!user || suppliers === null) {
    return <div className="loading-screen">{error || "Caricamento fornitori…"}</div>;
  }

  return (
    <div>
      <header className="topnav">
        <div className="brand"><Logo size={22} /> Cucina <span>Riserva</span></div>
        <nav className="tabs">
          <span className="tab" onClick={() => router.push("/dashboard")}>Magazzino</span>
          <span className="tab active">Fornitori</span>
          <span className="tab" onClick={() => router.push("/ricette")}>Ricette</span>
          <span className="tab" onClick={() => router.push("/report")}>Report</span>
        </nav>
        <div className="nav-right">
          <span className="user-chip" title={user.email}>{user.restaurant.charAt(0).toUpperCase()}</span>
        </div>
      </header>

      <main className="content">
        <div className="pagehead">
          <div>
            <h1>Fornitori</h1>
            <p>Collega ogni articolo al fornitore giusto — sai subito chi chiamare quando qualcosa finisce</p>
          </div>
          {user.role !== "staff" && <button className="btn-secondary" onClick={() => setShowForm(true)}>+ Nuovo fornitore</button>}
        </div>

        {error && <div className="err" style={{ marginBottom: 16 }}>{error}</div>}

        {suppliers.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">◈</span>
            <h3>Nessun fornitore ancora</h3>
            <p>Aggiungi il tuo primo fornitore per iniziare a collegarlo agli articoli del magazzino.</p>
            <button className="btn-secondary" onClick={() => setShowForm(true)}>+ Aggiungi fornitore</button>
          </div>
        ) : (
          <div className="grid">
            {suppliers.map((s) => (
              <div className="card supplier-card" key={s.id}>
                <div className="card-name">{s.name}</div>
                {s.phone && <div className="card-cat">📞 {s.phone}</div>}
                {s.email && <div className="card-cat">✉️ {s.email}</div>}
                {s.notes && <p className="supplier-notes">{s.notes}</p>}
                <div className="supplier-items-count">{s.items.length} articoli collegati</div>
              </div>
            ))}
          </div>
        )}

        <h2 className="section-label" style={{ marginTop: 40 }}>Collega articoli ai fornitori</h2>
        <div className="alert-list">
          {items.map((it) => (
            <div className="alert-row" key={it.id}>
              <span className="name">{it.name}</span>
              <select
                value={it.supplierId || ""}
                onChange={(e) => linkItem(it.id, e.target.value)}
                className="supplier-select"
              >
                <option value="">Nessun fornitore</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </main>

      {showForm && (
        <div className="overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Nuovo fornitore</h3>
            <input placeholder="Nome fornitore" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input placeholder="Telefono (opzionale)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <input placeholder="Email (opzionale)" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <input placeholder="Note (opzionale)" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            {error && <div className="err">{error}</div>}
            <div className="modal-actions">
              <button className="btn-ghost" onClick={() => setShowForm(false)}>Annulla</button>
              <button className="btn-secondary" onClick={createSupplier}>Salva</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
