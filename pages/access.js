import { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import { ScanLine, CameraOff } from "lucide-react";
import { listMembers, listInside, checkIn, checkOut, isMemberExpired } from "../lib/data";
import { parseQr } from "../lib/ticket";

const fmtDate = (ts) => ts.toDate().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

export default function Access() {
  const [members, setMembers] = useState([]);
  const [inside, setInside] = useState([]);
  const [selected, setSelected] = useState("");
  const [result, setResult] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [camError, setCamError] = useState("");
  const [manual, setManual] = useState("");

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const membersRef = useRef([]);
  const insideRef = useRef([]);
  const lastRef = useRef({ code: "", at: 0 });
  const busyRef = useRef(false);

  async function load() {
    const [m, i] = await Promise.all([listMembers(), listInside()]);
    membersRef.current = m;
    insideRef.current = i;
    setMembers(m);
    setInside(i);
  }
  useEffect(() => { load(); }, []);

  // Un seul QR code : le premier scan enregistre l'entrée, le suivant la sortie.
  async function processCode(raw) {
    const now = Date.now();
    if (busyRef.current) return;
    if (lastRef.current.code === raw && now - lastRef.current.at < 5000) return;
    lastRef.current = { code: raw, at: now };
    busyRef.current = true;
    try {
      const id = parseQr(raw);
      if (!id) { setResult({ type: "blocked", text: "❓ QR code non reconnu." }); return; }

      const member = membersRef.current.find((m) => m.id === id);
      if (!member) { setResult({ type: "blocked", text: "❓ Membre introuvable (QR supprimé ou ancien)." }); return; }

      const entry = insideRef.current.find((i) => i.memberId === id);
      if (entry) {
        if (now - entry.in.toMillis() < 30000) {
          setResult({ type: "ok", text: `✅ ${member.name} vient d'être enregistré(e).` });
          return;
        }
        await checkOut(entry.id);
        setResult({ type: "ok", text: `👋 Sortie enregistrée pour ${member.name}.` });
      } else {
        if (member.expiresAt.toMillis() < now) {
          setResult({ type: "blocked", text: `⛔ Accès refusé — l'abonnement de ${member.name} a expiré le ${fmtDate(member.expiresAt)}.` });
          return;
        }
        await checkIn(member);
        setResult({ type: "ok", text: `✅ Entrée validée pour ${member.name} — ${member.planLabel}, valable jusqu'au ${fmtDate(member.expiresAt)}.` });
      }
      if (navigator.vibrate) navigator.vibrate(80);
      await load();
    } catch (err) {
      console.error(err);
      setResult({ type: "blocked", text: "Erreur : l'action n'a pas pu être enregistrée." });
    } finally {
      busyRef.current = false;
    }
  }

  // Caméra + lecture du QR code
  useEffect(() => {
    if (!scanning) return;
    let stream = null, raf = 0, stopped = false;
    setCamError("");

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
        if (stopped) { stream.getTracks().forEach((t) => t.stop()); return; }
        const v = videoRef.current;
        v.srcObject = stream;
        v.setAttribute("playsinline", "true");
        await v.play();
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });

        const tick = () => {
          if (stopped) return;
          if (v.readyState === v.HAVE_ENOUGH_DATA && v.videoWidth) {
            const scale = Math.min(1, 640 / v.videoWidth);
            canvas.width = Math.round(v.videoWidth * scale);
            canvas.height = Math.round(v.videoHeight * scale);
            ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
            const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(img.data, img.width, img.height, { inversionAttempts: "dontInvert" });
            if (code && code.data) processCode(code.data);
          }
          raf = requestAnimationFrame(tick);
        };
        tick();
      } catch (err) {
        setCamError("Impossible d'ouvrir la caméra. Autorise l'accès à la caméra dans le navigateur, ou utilise le champ de saisie ci-dessous.");
        setScanning(false);
      }
    })();

    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, [scanning]);

  // Enregistrement manuel (sans QR)
  async function handleEntry() {
    const member = members.find((m) => m.id === selected);
    if (!member) return;
    if (await isMemberExpired(member)) {
      setResult({ type: "blocked", text: `⛔ Accès refusé — l'abonnement de ${member.name} a expiré. Le portique reste fermé.` });
      return;
    }
    if (inside.find((i) => i.memberId === member.id)) {
      setResult({ type: "blocked", text: `${member.name} est déjà enregistré comme présent.` });
      return;
    }
    await checkIn(member);
    setResult({ type: "ok", text: `✅ Entrée validée pour ${member.name}.` });
    load();
  }

  async function handleExit() {
    const entry = inside.find((i) => i.memberId === selected);
    if (!entry) {
      setResult({ type: "blocked", text: "Ce membre n'est pas marqué comme présent." });
      return;
    }
    await checkOut(entry.id);
    setResult({ type: "ok", text: `👋 Sortie enregistrée pour ${entry.memberName}.` });
    load();
  }

  return (
    <section>
      <div className="pageHead">
        <p className="eyebrow">Portique</p>
        <h2>CONTRÔLE D'ACCÈS</h2>
        <div className="bar" />
        <p className="sub">Scanne le QR code du ticket du membre pour enregistrer sa présence</p>
      </div>

      <div className="card">
        <div className="panelHead">
          <h3>Scanner un QR code</h3>
          <button className={scanning ? "ghost" : "primary"} onClick={() => setScanning((s) => !s)}>
            {scanning ? "Arrêter la caméra" : "Ouvrir la caméra"}
          </button>
        </div>

        {scanning && (
          <div className="scanner">
            <video ref={videoRef} muted playsInline />
            <div className="scanFrame" />
            <canvas ref={canvasRef} className="hiddenCanvas" />
          </div>
        )}
        {!scanning && !camError && (
          <p className="sub" style={{ margin: 0 }}><ScanLine size={14} style={{ verticalAlign: "-2px" }} /> Le premier scan enregistre l'entrée, le suivant la sortie.</p>
        )}
        {camError && <p className="error"><CameraOff size={14} style={{ verticalAlign: "-2px" }} /> {camError}</p>}

        <form className="row" style={{ marginTop: 14 }} onSubmit={(e) => { e.preventDefault(); if (manual.trim()) { processCode(manual.trim()); setManual(""); } }}>
          <div className="field" style={{ flex: 1, minWidth: 200 }}>
            <label>Ou saisir / coller le code (lecteur de codes-barres)</label>
            <input value={manual} onChange={(e) => setManual(e.target.value)} placeholder="TFIT:…" />
          </div>
          <button className="ghost" type="submit">Valider</button>
        </form>

        {result && <div className={"scanResult " + result.type}>{result.text}</div>}
      </div>

      <div className="card row">
        <div className="field" style={{ flex: 1, minWidth: 220 }}>
          <label>Enregistrement manuel (sans QR)</label>
          <select value={selected} onChange={(e) => setSelected(e.target.value)}>
            <option value="">— Choisir un membre —</option>
            {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
        <button className="primary" onClick={handleEntry}>Entrée</button>
        <button className="ghost" onClick={handleExit}>Sortie</button>
      </div>

      <div className="card">
        <h3>Présents dans la salle ({inside.length})</h3>
        <div className="tableWrap">
          <table>
            <thead><tr><th>Nom</th><th>Heure d'entrée</th></tr></thead>
            <tbody>
              {inside.map((i) => (
                <tr key={i.id}><td>{i.memberName}</td><td>{i.in.toDate().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</td></tr>
              ))}
              {inside.length === 0 && <tr><td colSpan={2} className="empty">Personne dans la salle actuellement.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
