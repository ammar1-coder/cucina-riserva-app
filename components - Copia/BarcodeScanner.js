import { useEffect, useRef, useState } from "react";

// Componente riutilizzabile: apre la fotocamera e legge un codice a barre.
// Al rilevamento chiama onDetected(codice) e si chiude da solo.
export default function BarcodeScanner({ onDetected, onClose }) {
  const regionId = "barcode-scan-region";
  const scannerRef = useRef(null);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    import("html5-qrcode").then(({ Html5Qrcode }) => {
      if (cancelled) return;
      const scanner = new Html5Qrcode(regionId);
      scannerRef.current = scanner;

      Html5Qrcode.getCameras()
        .then((cameras) => {
          if (cancelled || !cameras || cameras.length === 0) {
            setError("Nessuna fotocamera trovata su questo dispositivo.");
            return;
          }
          // Preferisci la fotocamera posteriore su mobile
          const back = cameras.find((c) => /back|rear|environment/i.test(c.label)) || cameras[0];
          scanner
            .start(
              back.id,
              { fps: 10, qrbox: { width: 250, height: 130 } },
              (decodedText) => {
                onDetected(decodedText);
              },
              () => {} // ignora i frame senza codice rilevato
            )
            .then(() => setReady(true))
            .catch(() => setError("Impossibile avviare la fotocamera. Controlla i permessi del browser."));
        })
        .catch(() => setError("Impossibile accedere alla fotocamera. Controlla i permessi del browser."));
    });

    return () => {
      cancelled = true;
      if (scannerRef.current) {
        scannerRef.current.stop().then(() => scannerRef.current.clear()).catch(() => {});
      }
    };
  }, [onDetected]);

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal scan-modal" onClick={(e) => e.stopPropagation()}>
        <h3>Scansiona il codice a barre</h3>
        <p className="modal-sub">{ready ? "Inquadra il codice a barre del prodotto." : "Avvio della fotocamera…"}</p>
        {error && <div className="err">{error}</div>}
        <div id={regionId} className="scan-region" />
        <div className="modal-actions">
          <button className="btn-ghost" onClick={onClose}>Annulla</button>
        </div>
      </div>
    </div>
  );
}
