import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "../lib/auth";
import { listJournal, listStaff } from "../lib/data";

const tone = (a) => (/Suppression|Retrait/.test(a) ? "exp" : /Modification/.test(a) ? "warn" : "ok");
const fmt = (ts) =>
  ts.toDate().toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }) + " • " +
  ts.toDate().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

export default function Journal() {
  const { role, loading } = useAuth();
  const router = useRouter();
  const [entries, setEntries] = useState([]);
  const [staff, setStaff] = useState({});
  const [loaded, setLoaded] = useState(false);
  const [who, setWho] = useState("all");
  const [kind, setKind] = useState("all");
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!loading && role !== "superadmin") router.replace("/");
  }, [loading, role]);

  useEffect(() => {
    if (role !== "superadmin") return;
    (async () => {
      const [list, st] = await Promise.all([listJournal(300), listStaff()]);
      const map = {};
      st.forEach((s) => { map[s.id] = s; });
      setStaff(map);
      setEntries(list);
      setLoaded(true);
    })();
  }, [role]);

  const people = useMemo(() => [...new Set(entries.map((e) => e.by))], [entries]);
  const kinds = useMemo(() => [...new Set(entries.map((e) => e.action))], [entries]);
  const filtered = entries.filter((e) =>
    (who === "all" || e.by === who) &&
    (kind === "all" || e.action === kind) &&
    (e.details + " " + e.action).toLowerCase().includes(q.trim().toLowerCase())
  );

  if (loading || role !== "superadmin") return null;

  return (
    <section>
      <div className="pageHead">
        <p className="eyebrow">Accès réservé</p>
        <h2>JOURNAL D'ACTIVITÉ</h2>
        <div className="bar" />
        <p className="sub">Qui a fait quoi : inscriptions, modifications, suppressions, ventes. Le journal ne peut être ni modifié ni effacé.</p>
      </div>

      <div className="card row">
        <div className="field">
          <label>Personne</label>
          <select value={who} onChange={(e) => setWho(e.target.value)}>
            <option value="all">Tout le monde</option>
            {people.map((p) => <option key={p} value={p}>{staff[p]?.name || p}</option>)}
          </select>
        </div>
        <div className="field">
          <label>Type d'action</label>
          <select value={kind} onChange={(e) => setKind(e.target.value)}>
            <option value="all">Toutes</option>
            {kinds.map((k) => <option key={k} value={k}>{k}</option>)}
          </select>
        </div>
        <div className="field" style={{ flex: 1, minWidth: 200 }}>
          <label>Rechercher</label>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nom d'un membre, montant…" />
        </div>
        <p className="countNote">{filtered.length} actions (300 dernières)</p>
      </div>

      <div className="card">
        <div className="tableWrap">
          <table>
            <thead><tr><th>Date</th><th>Par</th><th>Action</th><th>Détails</th></tr></thead>
            <tbody>
              {filtered.map((e) => (
                <tr key={e.id}>
                  <td style={{ whiteSpace: "nowrap" }}>{fmt(e.at)}</td>
                  <td>
                    <b>{staff[e.by]?.name || e.by.split("@")[0]}</b>
                    <div className="whoSub">
                      {staff[e.by] ? (staff[e.by].role === "superadmin" ? "Super admin" : "Gérant") : e.by}
                    </div>
                  </td>
                  <td><span className={"tag " + tone(e.action)}>{e.action}</span></td>
                  <td className="detailsCell">{e.details}</td>
                </tr>
              ))}
              {loaded && filtered.length === 0 && (
                <tr><td colSpan={4} className="empty">Aucune action enregistrée pour le moment. Le journal se remplit à partir de maintenant.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
