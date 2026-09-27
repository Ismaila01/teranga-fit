import { useEffect, useState } from "react";
import { listMembers, addMember, isMemberExpired, PLANS } from "../lib/data";

export default function Members() {
  const [members, setMembers] = useState([]);
  const [expiredMap, setExpiredMap] = useState({});
  const [form, setForm] = useState({ name: "", phone: "", plan: "mois", method: "Wave" });

  useEffect(() => { load(); }, []);

  async function load() {
    const list = await listMembers();
    setMembers(list);
    const map = {};
    for (const m of list) map[m.id] = await isMemberExpired(m);
    setExpiredMap(map);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    await addMember(form);
    setForm({ ...form, name: "", phone: "" });
    load();
  }

  return (
    <section>
      <div className="pageHead">
        <p className="eyebrow">Base membres</p>
        <h2>MEMBRES</h2>
        <div className="bar" />
        <p className="sub">Inscription, abonnement et paiement</p>
      </div>

      <form className="card row" onSubmit={handleSubmit}>
        <div className="field">
          <label>Nom</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Modou Diop" />
        </div>
        <div className="field">
          <label>Téléphone</label>
          <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="77 000 00 00" />
        </div>
        <div className="field">
          <label>Formule</label>
          <select value={form.plan} onChange={(e) => setForm({ ...form, plan: e.target.value })}>
            {Object.entries(PLANS).map(([key, p]) => (
              <option key={key} value={key}>{p.label} — {p.price.toLocaleString("fr-FR")} FCFA</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Paiement</label>
          <select value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })}>
            <option>Wave</option><option>Orange Money</option><option>Espèces</option><option>Carte</option>
          </select>
        </div>
        <button className="primary" type="submit">Inscrire</button>
      </form>

      <div className="card">
        <h3>Liste des membres</h3>
        <table>
          <thead><tr><th>Nom</th><th>Tél.</th><th>Formule</th><th>Expire le</th><th>Statut</th></tr></thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id}>
                <td>{m.name}</td><td>{m.phone || "—"}</td><td>{m.planLabel}</td>
                <td>{m.expiresAt.toDate().toLocaleDateString("fr-FR")}</td>
                <td><span className={"tag " + (expiredMap[m.id] ? "exp" : "ok")}>{expiredMap[m.id] ? "Expiré" : "Actif"}</span></td>
              </tr>
            ))}
            {members.length === 0 && <tr><td colSpan={5} className="empty">Aucun membre pour l'instant.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}
