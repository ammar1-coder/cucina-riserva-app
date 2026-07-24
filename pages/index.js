import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Logo from "../components/Logo";

function Reveal({ children, delay = 0 }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.15 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} className={`reveal ${visible ? "in" : ""}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

const FEATURES = [
  { title: "Controllo in tempo reale", text: "Ogni carico e ogni consumo registrato all'istante. Sai sempre cosa hai in dispensa, senza fogli sparsi.", icon: "◈" },
  { title: "Avvisi automatici", text: "Quando un ingrediente sta per esaurirsi, lo sai prima che diventi un problema in cucina.", icon: "◆" },
  { title: "Pensato per la cucina", text: "Interfaccia rapida e chiara, fatta per essere usata durante il servizio — non un altro software da ufficio.", icon: "◇" },
  { title: "I tuoi dati, al sicuro", text: "Ogni ristorante ha il proprio spazio privato, protetto e sempre disponibile.", icon: "◈" },
];

const PLANS = [
  { name: "Essenziale", price: "35", desc: "Per attività singole che iniziano a digitalizzare il magazzino.", features: ["1 sede", "Fino a 150 articoli", "Avvisi scorte basse", "Supporto via email"] },
  { name: "Riserva", price: "50", desc: "Il piano più scelto dai ristoranti con cucina attiva ogni giorno.", features: ["1 sede", "Articoli illimitati", "Collegamento alle ricette", "Report mensili", "Supporto prioritario"], featured: true },
  { name: "Tenuta", price: "85", desc: "Per gruppi con più sedi da gestire da un unico pannello.", features: ["Fino a 5 sedi", "Articoli illimitati", "Gestione fornitori", "Report avanzati", "Supporto dedicato"] },
];

export default function Landing() {
  const router = useRouter();
  const goRegister = () => router.push("/register");

  return (
    <div className="land">
      <header className="lnav">
        <div className="brand"><Logo size={26} /> Scorta <span>Riserva</span></div>
        <nav className="lnav-links">
          <a href="#funzioni">Funzioni</a>
          <a href="#prezzi">Prezzi</a>
        </nav>
        <div className="lnav-actions">
          <Link className="link-accedi" href="/login">Accedi</Link>
          <button className="btn-gold sm" onClick={goRegister}><span>Inizia gratis</span></button>
        </div>
      </header>

      <section className="hero">
        <div className="hero-glow" />
        <div className="hero-inner">
          <div className="eyebrow"><span className="eyebrow-dot" />Gestione magazzino per ristoranti</div>
          <h1 className="hero-title">La tua dispensa,<br /><span>gestita come merita.</span></h1>
          <p className="hero-sub">Scorta porta ordine ed eleganza nel magazzino del tuo ristorante — meno sprechi, zero sorprese, controllo totale.</p>
          <div className="hero-cta">
            <button className="btn-gold" onClick={goRegister}><span>Inizia gratis per 14 giorni</span></button>
            <a className="btn-outline" href="#funzioni">Guarda come funziona</a>
          </div>
          <p className="hero-note">Nessuna carta di credito richiesta</p>
        </div>
        <div className="hero-card">
          <div className="hero-card-glow" />
          <div className="hc-row"><span>Pomodori San Marzano</span><span className="hc-val ok">42 kg</span></div>
          <div className="hc-row"><span>Olio EVO</span><span className="hc-val low">2,5 L</span></div>
          <div className="hc-row"><span>Basilico fresco</span><span className="hc-val out">Esaurito</span></div>
          <div className="hc-row"><span>Farina 00</span><span className="hc-val low">3 kg</span></div>
        </div>
      </section>

      <section className="strip">
        <Reveal><div className="strip-item"><span className="strip-num">−28%</span><span className="strip-label">sprechi in media</span></div></Reveal>
        <Reveal delay={80}><div className="strip-item"><span className="strip-num">3 min</span><span className="strip-label">per registrare un carico</span></div></Reveal>
        <Reveal delay={160}><div className="strip-item"><span className="strip-num">24/7</span><span className="strip-label">accesso da qualsiasi dispositivo</span></div></Reveal>
      </section>

      <section className="section" id="funzioni">
        <Reveal><h2 className="section-title">Fatto per chi lavora in cucina</h2></Reveal>
        <Reveal delay={60}><p className="section-sub">Non un altro gestionale complicato — uno strumento che si usa davvero, ogni giorno.</p></Reveal>
        <div className="feat-grid">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={i * 90}>
              <div className="feat-card">
                <span className="feat-icon">{f.icon}</span>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="section alt" id="prezzi">
        <Reveal><h2 className="section-title">Un piano per ogni cucina</h2></Reveal>
        <Reveal delay={60}><p className="section-sub">Prova gratuita di 14 giorni su ogni piano. Disdici quando vuoi.</p></Reveal>
        <div className="plan-grid">
          {PLANS.map((p, i) => (
            <Reveal key={p.name} delay={i * 100}>
              <div className={`plan-card ${p.featured ? "featured" : ""}`}>
                {p.featured && <span className="plan-tag">Più scelto</span>}
                <h3>{p.name}</h3>
                <p className="plan-desc">{p.desc}</p>
                <div className="plan-price"><span className="cur">€</span>{p.price}<span className="per">/mese</span></div>
                <ul>{p.features.map((f) => <li key={f}>{f}</li>)}</ul>
                <button className={p.featured ? "btn-gold" : "btn-outline"} onClick={goRegister}><span>Inizia gratis</span></button>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="cta-band">
        <Reveal>
          <h2>Porta ordine nella tua dispensa, da oggi.</h2>
          <button className="btn-gold lg" onClick={goRegister}><span>Crea il tuo account</span></button>
        </Reveal>
      </section>

      <footer className="lfoot">
        <div className="brand small"><Logo size={20} /> Scorta <span>Riserva</span></div>
        <p>© 2026 Scorta. Tutti i diritti riservati.</p>
      </footer>
    </div>
  );
}
