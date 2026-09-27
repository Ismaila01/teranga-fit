import { useEffect, useState } from "react";
import { listTicketsToday, sellTicket, TICKET_TYPES } from "../lib/data";

export default function Caisse() {
  const [tickets, setTickets] = useState([]);
  const [form, setForm] = useState({ type: "seance", buyer: "", method: "Espèces" });

  useEffect(() => { load(); }, []);

  async function load() {
    setTickets(await listTicketsToday());
  }

  async function handleSell(e) {
    e.preventDefault();
    await sellTicket(form);
    setForm({ ...form, buyer: "" });
    load();
  }

  const todayTotal = tickets.reduce((s, t) => s + t.amount, 0);

  return (
    <section>
      <h2>Billetterie & Caisse</h2>
      <p className="sub">Tickets à l'unité et suivi de la caisse du jour</p>

      <div className="grid4">
        <div className="stat teal"><b>{todayTotal.toLocaleString("fr-FR")}</b><span>Encaissé aujourd'hui (FCFA)</span></div>
        <div className="stat"><b>{tickets.length}</b><span>Tickets vendus aujourd'hui</span></div>
      </div>

      <form className="card row" onSubmit={handleSell}>
        <div className="field">
          <label>Type de ticket</label>
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            {Object.entries(TICKET_TYPES).map(([key, t]) => (
              <option key={key} value={key}>{t.label} — {t.price.toLocaleString("fr-FR")} FCFA</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Acheteur (optionnel)</label>
          <input value={form.buyer} onChange={(e) => setForm({ ...form, buyer: e.target.value })} placeholder="Nom du client" />
        </div>
        <div className="field">
          <label>Paiement</label>
          <select value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })}>
            <option>Espèces</option><option>Wave</option><option>Orange Money</option><option>Carte</option>
          </select>
        </div>
        <button className="primary" type="submit">Encaisser</button>
      </form>

      <div className="card">
        <h3>Journal de caisse — aujourd'hui</h3>
        <table>
          <thead><tr><th>Heure</th><th>Libellé</th><th>Client</th><th>Montant</th><th>Moyen</th></tr></thead>
          <tbody>
            {tickets.map((t) => (
              <tr key={t.id}>
                <td>{t.date.toDate().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</td>
                <td>{t.label}</td><td>{t.buyer}</td>
                <td>{t.amount.toLocaleString("fr-FR")} F</td><td>{t.method}</td>
              </tr>
            ))}
            {tickets.length === 0 && <tr><td colSpan={5} className="empty">Aucune vente aujourd'hui.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}
