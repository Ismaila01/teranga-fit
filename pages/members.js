import { useEffect, useState } from "react";
import { listMembers, addMember, updateMember, deleteMember, isMemberExpired, PLANS } from "../lib/data";
import { useAuth } from "../lib/auth";
import { Timestamp } from "firebase/firestore";

export default function Members() {
  const { role } = useAuth();
  const isSuperAdmin = role === "superadmin";
  const [members, setMembers] = useState([]);
  const [expiredMap, setExpiredMap] = useState({});
  const [form, setForm] = useState({ name: "", phone: "", plan: "mois", method: "Wave" });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", phone: "", expires: "" });

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

  function startEdit(m) {
    setEditingId(m.id);
    setEditForm({ name: m.name, phone: m.phone || "", expires: m.expiresAt.toDate().toISOString().slice(0, 10) });
  }

  async function saveEdit(id) {
    await updateMember(id, {
      name: editForm.name,
      phone: editForm.phone,
      expiresAt: Timestamp.fromDate(new Date(editForm.expires)),
    });
    setEditingId(null);
    load();
  }

  async function handleDelete(id, name) {
    if (!confirm(`Supprimer définitivement ${name} ?`)) return;
    await deleteMember(id);
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
            <option>Wave</option><option>Orange Money</option><option>Espèces</option>
          </select>
        </div>
        <button className="primary" type="submit">Inscrire</button>
      </form>

      <div className="card">
        <h3>Liste des membres</h3>
        <table>
          <thead>
            <tr>
              <th>Nom</th><th>Tél.</th><th>Formule</th><th>Expire le</th><th>Statut</th>
              {isSuperAdmin && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              editingId === m.id ? (
                <tr key={m.id}>
                  <td><input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} /></td>
                  <td><input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} /></td>
                  <td>{m.planLabel}</td>
                  <td><input type="date" value={editForm.expires} onChange={(e) => setEditForm({ ...editForm, expires: e.target.value })} /></td>
                  <td><span className={"tag " + (expiredMap[m.id] ? "exp" : "ok")}>{expiredMap[m.id] ? "Expiré" : "Actif"}</span></td>
                  <td style={{ display: "flex", gap: 6 }}>
                    <button className="ghost" onClick={() => saveEdit(m.id)}>Enregistrer</button>
                    <button className="ghost" onClick={() => setEditingId(null)}>Annuler</button>
                  </td>
                </tr>
              ) : (
                <tr key={m.id}>
                  <td>{m.name}</td><td>{m.phone || "—"}</td><td>{m.planLabel}</td>
                  <td>{m.expiresAt.toDate().toLocaleDateString("fr-FR")}</td>
                  <td><span className={"tag " + (expiredMap[m.id] ? "exp" : "ok")}>{expiredMap[m.id] ? "Expiré" : "Actif"}</span></td>
                  {isSuperAdmin && (
                    <td style={{ display: "flex", gap: 6 }}>
                      <button className="ghost" onClick={() => startEdit(m)}>Modifier</button>
                      <button className="ghost" onClick={() => handleDelete(m.id, m.name)}>Supprimer</button>
                    </td>
                  )}
                </tr>
              )
            ))}
            {members.length === 0 && <tr><td colSpan={isSuperAdmin ? 6 : 5} className="empty">Aucun membre pour l'instant.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}
