import { useEffect, useState } from "react";
import { listMembers, listInside, checkIn, checkOut, isMemberExpired } from "../lib/data";

export default function Access() {
  const [members, setMembers] = useState([]);
  const [inside, setInside] = useState([]);
  const [selected, setSelected] = useState("");
  const [result, setResult] = useState(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setMembers(await listMembers());
    setInside(await listInside());
  }

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
    setResult({ type: "ok", text: `✅ Entrée validée pour ${member.name}. Portique ouvert.` });
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
      <h2>Contrôle d'accès</h2>
      <p className="sub">Scan QR au portique</p>

      <div className="card row">
        <div className="field" style={{ flex: 1, minWidth: 220 }}>
          <label>Membre</label>
          <select value={selected} onChange={(e) => setSelected(e.target.value)}>
            <option value="">— Choisir —</option>
            {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
        <button className="primary" onClick={handleEntry}>Scanner → Entrée</button>
        <button className="ghost" onClick={handleExit}>Scanner → Sortie</button>
      </div>
      {result && <div className={"scanResult " + result.type}>{result.text}</div>}

      <div className="card">
        <h3>Présents dans la salle</h3>
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
    </section>
  );
}
