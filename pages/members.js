import { useEffect, useState } from "react";
import { Timestamp } from "firebase/firestore";
import { MessageCircle, QrCode as QrIcon } from "lucide-react";
import { listMembers, addMember, updateMember, deleteMember, ensurePass, isMemberExpired, PLANS } from "../lib/data";
import { passUrl, whatsappLink, ticketMessage } from "../lib/ticket";
import { useAuth } from "../lib/auth";

export default function Members() {
  const { role } = useAuth();
  const isSuperAdmin = role === "superadmin";
  const [members, setMembers] = useState([]);
  const [expiredMap, setExpiredMap] = useState({});
  const [form, setForm] = useState({ name: "", phone: "", plan: "mensuel_sans", method: "Wave" });
  const [created, setCreated] = useState(null);
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
    const name = form.name.trim();
    if (!name) return;
    const res = await addMember({ ...form, name });
    const link = passUrl(res.id);
    setCreated({
      name, phone: form.phone, planLabel: res.planLabel, endAt: res.endAt, link,
      wa: whatsappLink(form.phone, ticketMessage({ name, planLabel: res.planLabel, endAt: res.endAt, link })),
    });
    setForm({ ...form, name: "", phone: "" });
    load();
  }

  // Ouvre un lien après avoir vérifié que le ticket du membre existe
  // (la fenêtre est ouverte tout de suite pour ne pas être bloquée par le navigateur).
  async function openWithPass(m, buildUrl) {
    const w = window.open("about:blank", "_blank");
    try { await ensurePass(m); } catch (err) { console.error(err); }
    const url = buildUrl(m);
    if (w) w.location.href = url; else window.location.href = url;
  }
  const sendWhatsApp = (m) => openWithPass(m, (x) =>
    whatsappLink(x.phone, ticketMessage({ name: x.name, planLabel: x.planLabel, endAt: x.expiresAt, link: passUrl(x.id) })));
  const viewTicket = (m) => openWithPass(m, (x) => passUrl(x.id));

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

  const colCount = isSuperAdmin ? 7 : 6;

  return (
    <section>
      <div className="pageHead">
        <p className="eyebrow">Base membres</p>
        <h2>MEMBRES</h2>
        <div className="bar" />
        <p className="sub">Inscription, abonnement, paiement et envoi du ticket QR par WhatsApp</p>
      </div>

      <form className="card row" onSubmit={handleSubmit}>
        <div className="field">
          <label>Nom</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Modou Diop" />
        </div>
        <div className="field">
          <label>Téléphone (WhatsApp)</label>
          <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="77 000 00 00" inputMode="tel" />
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

      {created && (
        <div className="card successCard">
          <p style={{ margin: "0 0 12px" }}>
            ✅ <b>{created.name}</b> est inscrit(e) — {created.planLabel}, jusqu'au{" "}
            {created.endAt.toDate().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}.
          </p>
          <div className="cellActions">
            <a className="primary ctaLink" href={created.wa} target="_blank" rel="noreferrer">
              <MessageCircle size={16} /> Envoyer le ticket par WhatsApp
            </a>
            <a className="ghost" href={created.link} target="_blank" rel="noreferrer">Voir le ticket</a>
            <button className="ghost" onClick={() => setCreated(null)}>Fermer</button>
          </div>
          {!created.phone.trim() && (
            <p className="sub" style={{ margin: "10px 0 0" }}>Aucun numéro saisi : WhatsApp te laissera choisir le contact.</p>
          )}
        </div>
      )}

      <div className="card">
        <h3>Liste des membres</h3>
        <div className="tableWrap">
          <table>
            <thead>
              <tr>
                <th>Nom</th><th>Tél.</th><th>Formule</th><th>Expire le</th><th>Statut</th><th>Ticket QR</th>
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
                    <td />
                    <td>
                      <div className="cellActions">
                        <button className="ghost" onClick={() => saveEdit(m.id)}>Enregistrer</button>
                        <button className="ghost" onClick={() => setEditingId(null)}>Annuler</button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr key={m.id}>
                    <td>{m.name}</td><td>{m.phone || "—"}</td><td>{m.planLabel}</td>
                    <td>{m.expiresAt.toDate().toLocaleDateString("fr-FR")}</td>
                    <td><span className={"tag " + (expiredMap[m.id] ? "exp" : "ok")}>{expiredMap[m.id] ? "Expiré" : "Actif"}</span></td>
                    <td>
                      <div className="cellActions">
                        <button className="ghost iconText" onClick={() => sendWhatsApp(m)}><MessageCircle size={14} /> WhatsApp</button>
                        <button className="ghost iconText" onClick={() => viewTicket(m)}><QrIcon size={14} /> Voir</button>
                      </div>
                    </td>
                    {isSuperAdmin && (
                      <td>
                        <div className="cellActions">
                          <button className="ghost" onClick={() => startEdit(m)}>Modifier</button>
                          <button className="ghost" onClick={() => handleDelete(m.id, m.name)}>Supprimer</button>
                        </div>
                      </td>
                    )}
                  </tr>
                )
              ))}
              {members.length === 0 && <tr><td colSpan={colCount} className="empty">Aucun membre pour l'instant.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
