import { useEffect, useMemo, useState } from "react";
import { listSubscriptions, listMembers } from "../lib/data";

const DAY = 86400000;
const fmtDate = (ts) => ts.toDate().toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });

export default function History() {
  const [rows, setRows] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");

  useEffect(() => {
    (async () => {
      const [subs, members] = await Promise.all([listSubscriptions(), listMembers()]);
      // Les membres inscrits avant la mise en place de l'historique n'ont pas
      // encore de ligne d'abonnement : on les reconstitue depuis leur fiche.
      const withSubs = new Set(subs.map((s) => s.memberId));
      const fromMembers = members
        .filter((m) => !withSubs.has(m.id))
        .map((m) => ({
          id: "m-" + m.id, memberName: m.name, planLabel: m.planLabel,
          startAt: m.createdAt, endAt: m.expiresAt, amount: null, method: null,
        }));
      const all = [...subs, ...fromMembers].sort((a, b) => b.startAt.toMillis() - a.startAt.toMillis());
      setRows(all);
      setLoaded(true);
    })();
  }, []);

  const now = Date.now();
  const filtered = useMemo(() => rows.filter((r) => {
    const active = r.endAt.toMillis() >= now;
    if (status === "active" && !active) return false;
    if (status === "ended" && active) return false;
    return r.memberName.toLowerCase().includes(q.trim().toLowerCase());
  }), [rows, q, status]);

  const activeCount = rows.filter((r) => r.endAt.toMillis() >= now).length;

  return (
    <section>
      <div className="pageHead">
        <p className="eyebrow">Suivi des abonnements</p>
        <h2>HISTORIQUE DES ABONNEMENTS</h2>
        <div className="bar" />
        <p className="sub">Date d'entrée et date de fin de chaque abonnement</p>
      </div>

      <div className="card row">
        <div className="field" style={{ flex: 1, minWidth: 220 }}>
          <label>Rechercher un membre</label>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nom du membre…" />
        </div>
        <div className="field">
          <label>Statut</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">Tous</option>
            <option value="active">En cours</option>
            <option value="ended">Terminés</option>
          </select>
        </div>
        <p className="countNote">{rows.length} abonnements • {activeCount} en cours • {rows.length - activeCount} terminés</p>
      </div>

      <div className="card">
        <div className="tableWrap">
          <table>
            <thead>
              <tr><th>Membre</th><th>Formule</th><th>Date d'entrée</th><th>Date de fin</th><th>Statut</th><th>Montant</th></tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const left = Math.ceil((r.endAt.toMillis() - now) / DAY);
                const active = r.endAt.toMillis() >= now;
                return (
                  <tr key={r.id}>
                    <td>{r.memberName}</td>
                    <td>{r.planLabel}</td>
                    <td>{fmtDate(r.startAt)}</td>
                    <td>{fmtDate(r.endAt)}</td>
                    <td>
                      {active
                        ? <span className={"tag " + (left <= 3 ? "warn" : "ok")}>{left <= 0 ? "Expire aujourd'hui" : `En cours • ${left} j`}</span>
                        : <span className="tag exp">Terminé</span>}
                    </td>
                    <td>{r.amount != null ? `${r.amount.toLocaleString("fr-FR")} F${r.method ? " • " + r.method : ""}` : "—"}</td>
                  </tr>
                );
              })}
              {loaded && filtered.length === 0 && <tr><td colSpan={6} className="empty">Aucun abonnement trouvé.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
