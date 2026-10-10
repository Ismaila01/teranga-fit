import { useEffect, useMemo, useState } from "react";
import { listAccessHistory } from "../lib/data";

const fmtDay = (ts) => ts.toDate().toLocaleDateString("fr-FR", { weekday: "short", day: "2-digit", month: "short" });
const fmtTime = (ts) => ts.toDate().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

function duration(inTs, outTs) {
  if (!outTs) return null;
  const min = Math.max(0, Math.round((outTs.toMillis() - inTs.toMillis()) / 60000));
  const h = Math.floor(min / 60), m = min % 60;
  return h ? `${h} h ${String(m).padStart(2, "0")}` : `${m} min`;
}

export default function AccessHistory() {
  const [days, setDays] = useState(7);
  const [rows, setRows] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");

  useEffect(() => {
    setLoaded(false);
    listAccessHistory(days === 0 ? null : days).then((r) => { setRows(r); setLoaded(true); });
  }, [days]);

  const filtered = useMemo(() => rows.filter((r) => {
    if (status === "inside" && r.out) return false;
    if (status === "left" && !r.out) return false;
    return r.memberName.toLowerCase().includes(q.trim().toLowerCase());
  }), [rows, q, status]);

  const distinct = new Set(filtered.map((r) => r.memberId)).size;

  return (
    <section>
      <div className="pageHead">
        <p className="eyebrow">Fréquentation</p>
        <h2>HISTORIQUE DES ACCÈS</h2>
        <div className="bar" />
        <p className="sub">Toutes les entrées et sorties enregistrées au portique</p>
      </div>

      <div className="card row">
        <div className="field">
          <label>Période</label>
          <select value={days} onChange={(e) => setDays(Number(e.target.value))}>
            <option value={1}>Aujourd'hui</option>
            <option value={7}>7 derniers jours</option>
            <option value={30}>30 derniers jours</option>
            <option value={0}>Tout (500 derniers)</option>
          </select>
        </div>
        <div className="field" style={{ flex: 1, minWidth: 200 }}>
          <label>Rechercher un membre</label>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nom du membre…" />
        </div>
        <div className="field">
          <label>Statut</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">Tous</option>
            <option value="inside">Dans la salle</option>
            <option value="left">Sortis</option>
          </select>
        </div>
        <p className="countNote">{filtered.length} passages • {distinct} membres différents</p>
      </div>

      <div className="card">
        <div className="tableWrap">
          <table>
            <thead><tr><th>Membre</th><th>Date</th><th>Entrée</th><th>Sortie</th><th>Durée</th></tr></thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id}>
                  <td>{r.memberName}</td>
                  <td style={{ textTransform: "capitalize" }}>{fmtDay(r.in)}</td>
                  <td>{fmtTime(r.in)}</td>
                  <td>{r.out ? fmtTime(r.out) : <span className="tag ok">Dans la salle</span>}</td>
                  <td>{duration(r.in, r.out) || "—"}</td>
                </tr>
              ))}
              {loaded && filtered.length === 0 && <tr><td colSpan={5} className="empty">Aucun passage sur cette période.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
