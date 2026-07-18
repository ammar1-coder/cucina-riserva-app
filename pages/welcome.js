import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Logo from "../components/Logo";

export default function Home() {
  const router = useRouter();
  const [fadingOut, setFadingOut] = useState(false);

  const goToLogin = () => router.push("/login");

  useEffect(() => {
    const t1 = setTimeout(() => setFadingOut(true), 2400);
    const t2 = setTimeout(goToLogin, 2900);
    return () => { clearTimeout(t1); clearTimeout(t2); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const skip = () => { setFadingOut(true); setTimeout(goToLogin, 300); };

  return (
    <div className={`splash ${fadingOut ? "out" : ""}`} onClick={skip}>
      <div className="splash-glow" />
      <Logo size={80} animated />
      <div className="rule" />
      <h1 className="wordmark">CUCINA <span>RISERVA</span></h1>
      <p className="tagline">Benvenuto. L'eccellenza in cucina inizia dalla dispensa.</p>
      <span className="skip-hint">tocca per continuare</span>
    </div>
  );
}
