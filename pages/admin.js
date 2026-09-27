import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "../lib/auth";
import { listStaff, addStaff, removeStaff } from "../lib/data";

export default function Admin() {
  const { role, loading } = useAuth();
  const router = useRouter();
  const [staff, setStaff] = useState([]);
  const [form, setForm] = useState({ email: "", name: "", role: "gerant" });

  useEffect(() => {
    if (!loading && role !== "superadmin") router.replace("/");
  }, [loading, role]);

  useEffect(() => { if (role === "superadmin") load(); }, [role]);

  async function load() {
    setStaff(await listStaff());
  }

  async function handleAdd(e) {
    e.preventDefault();
    if (!form.email.trim() || !form.name.trim()) return;
    await addStaff(form);
    setForm({ email: "", name: "", role: "gerant" });
    load();
  }

  async function handleRemove(email) {
    if (!confirm(`Retirer l'accès de ${email} ?`)) return;
    await removeStaff(email);
    load();
  }

  if (loading || role !== "superadmin") return null;

  return (
    <section>
      <div className="pageHead">
        <p className="eyebrow">Accès réservé</p>
        <h2>SUPER ADMIN</h2>
        <div className="bar" />
        <p className="sub">Gestion des comptes gérants et super admin</p>
      </div>

      <div className="card">
        <h3>⚠️ Étape manuelle requise</h3>
        <p style={{ fontSize: 13.5, color: "var(--muted)", margin: 0 }}>
          Ajouter une fiche ici définit le <strong>rôle</strong> de la personne, mais ne crée pas
          son compte de connexion. Va dans la console Firebase → Authentication → Users →
          "Ajouter un utilisateur", avec exactement le même email, pour lui donner un mot de passe.
        </p>
      </div>

      <form className="card row" onSubmit={handleAdd}>
        <div className="field">
          <label>Nom</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nom complet" />
        </div>
        <div className="field">
          <label>Email</label>
          <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@exemple.com" />
        </div>
        <div className="field">
          <label>Rôle</label>
          <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            <option value="gerant">Gérant</option>
            <option value="superadmin">Super admin</option>
          </select>
        </div>
        <button className="primary" type="submit">Ajouter</button>
      </form>

      <div className="card">
        <h3>Comptes existants</h3>
        <table>
          <thead><tr><th>Nom</th><th>Email</th><th>Rôle</th><th></th></tr></thead>
          <tbody>
            {staff.map((s) => (
              <tr key={s.id}>
                <td>{s.name}</td><td>{s.id}</td>
                <td><span className={"tag " + (s.role === "superadmin" ? "exp" : "ok")}>{s.role === "superadmin" ? "Super admin" : "Gérant"}</span></td>
                <td><button className="ghost" onClick={() => handleRemove(s.id)}>Retirer</button></td>
              </tr>
            ))}
            {staff.length === 0 && <tr><td colSpan={4} className="empty">Aucun compte enregistré.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}
