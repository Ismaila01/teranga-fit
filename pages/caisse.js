import { useEffect, useState } from "react";
import { listTicketsToday, sellTicket, deleteTicket, TICKET_TYPES } from "../lib/data";
import { useAuth } from "../lib/auth";

const METHOD_LOGOS = { Wave: "/images/wave-logo.jpg", "Orange Money": "/images/orange-money-logo.png" };
const METHOD_ICONS = { Espèces: "💵" };
const METHOD_LIST = ["Wave", "Orange Money", "Espèces"];

function QrPlaceholder() {
  // Motif décoratif façon QR (visuel uniquement, ne code aucune donnée)
  const cells = [];
  let seed = 42;
  const rand = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
  for (let i = 0; i < 100; i++) cells.push(rand() > 0.55);
  return (
    <svg viewBox="0 0 100 100" className="qrBox">
      <rect width="100" height="100" fill="#fff" />
      {cells.map((on, i) => on && (
        <rect key={i} x={(i % 10) * 10} y={Math.floor(i / 10) * 10} width="10" height="10" fill="#17181B" />
      ))}
      <rect x="0" y="0" width="24" height="24" fill="none" stroke="#17181B" strokeWidth="4" />
      <rect x="76" y="0" width="24" height="24" fill="none" stroke="#17181B" strokeWidth="4" />
      <rect x="0" y="76" width="24" height="24" fill="none" stroke="#17181B" strokeWidth="4" />
    </svg>
  );
}

export default function Caisse() {
  const { role } = useAuth();
  const isSuperAdmin = role === "superadmin";
  const [todayList, setTodayList] = useState([]);
  const [ticketType, setTicketType] = useState("seance");
  const [buyer, setBuyer] = useState("");
  const [method, setMethod] = useState("Wave");
  const [lastSale, setLastSale] = useState(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setTodayList(await listTicketsToday());
  }

  const price = TICKET_TYPES[ticketType].price;

  async function handleConfirm() {
    await sellTicket({ type: ticketType, buyer, method });
    setLastSale({ label: TICKET_TYPES[ticketType].label, buyer: buyer || "Client comptoir", method, amount: price, date: new Date() });
    setBuyer("");
    load();
  }

  const todayTotal = todayList.reduce((s, t) => s + t.amount, 0);

  async function handleDeleteTicket(id) {
    if (!confirm("Supprimer cette vente du journal ?")) return;
    await deleteTicket(id);
    load();
  }

  return (
    <section>
      <div className="posGrid">
        {/* Colonne 1 — Client & type de ticket */}
        <div className="posCol">
          <h3>Client & Ticket</h3>
          <p className="posLabel">Sélectionnez le type de passage</p>
          <input className="posSearch" placeholder="Nom du client (optionnel)…" value={buyer} onChange={(e) => setBuyer(e.target.value)} />

          <p className="posSection">Types de ticket</p>
          {Object.entries(TICKET_TYPES).map(([key, t]) => (
            <div key={key} className={"posOption" + (ticketType === key ? " selected" : "")} onClick={() => setTicketType(key)}>
              <div>
                <b>{t.label}</b>
                <div className="posMeta">Accès à l'unité</div>
              </div>
              <div className="posPrice">{t.price.toLocaleString("fr-FR")}<br/>FCFA</div>
            </div>
          ))}
        </div>

        {/* Colonne 2 — Méthode de paiement */}
        <div className="posCol">
          <h3>Méthode de Paiement</h3>
          <p className="posLabel">Choisissez le mode de paiement</p>

          {METHOD_LIST.map((m) => (
            <div key={m} className={"methodCard" + (method === m ? " selected" : "")} onClick={() => setMethod(m)}>
              <div className="methodIcon">
                {METHOD_LOGOS[m]
                  ? <img src={METHOD_LOGOS[m]} alt={m} className="methodLogoImg" />
                  : METHOD_ICONS[m]}
              </div>
              <div>
                <b style={{ display: "flex", alignItems: "center", gap: 8 }}>{m}</b>
                <div className="posMeta">Paiement {m === "Espèces" ? "en liquide au comptoir" : `via ${m}`}</div>
              </div>
              {m === "Wave" && <span className="recBadge">Recommandé</span>}
            </div>
          ))}

          <p className="posSection" style={{ marginTop: 18 }}>Montant à payer</p>
          <div className="totalBox"><span>Total</span><span>{price.toLocaleString("fr-FR")} FCFA</span></div>
        </div>

        {/* Colonne 3 — Aperçu du ticket */}
        <div className="posCol">
          <h3>Aperçu du Ticket</h3>
          <p className="posLabel">&nbsp;</p>
          <div className="ticketPreview">
            <div className="ticketStamp">TICKET DE CAISSE</div>
            <div style={{ fontSize: 13, fontWeight: 700 }}>TERANGA FIT - Salle de Sport</div>
            <div style={{ fontSize: 11, color: "#6B6D73" }}>{new Date().toLocaleDateString("fr-FR")} • {new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</div>
            <div className="ticketDivider" />
            <div className="ticketRow"><span>Client:</span><b>{buyer || "Client comptoir"}</b></div>
            <div className="ticketRow"><span>Formule:</span><b>{TICKET_TYPES[ticketType].label}</b></div>
            <div className="ticketRow"><span>Paiement:</span><b style={{ color: "var(--coral)" }}>{method}</b></div>
            <div className="ticketDivider" />
            <div className="ticketRow"><span>{TICKET_TYPES[ticketType].label} x1</span><span>{price.toLocaleString("fr-FR")} FCFA</span></div>
            <div className="ticketDivider" />
            <div className="ticketRow" style={{ fontWeight: 700, fontSize: 15 }}><span>TOTAL</span><span>{price.toLocaleString("fr-FR")} FCFA</span></div>
            <QrPlaceholder />
            <div style={{ fontSize: 10, color: "#6B6D73" }}>SCAN POUR VÉRIFIER</div>
          </div>
          <button className="posPrimary" onClick={handleConfirm}>🖨️ Encaisser & Imprimer</button>
          <button className="posGhost" onClick={() => setBuyer("")}>Annuler la transaction</button>
        </div>
      </div>

      <div className="card" style={{ marginTop: 18 }}>
        <h3>Journal de caisse — aujourd'hui ({todayList.length} transactions, {todayTotal.toLocaleString("fr-FR")} FCFA)</h3>
        <table>
          <thead><tr><th>Heure</th><th>Libellé</th><th>Client</th><th>Montant</th><th>Moyen</th>{isSuperAdmin && <th></th>}</tr></thead>
          <tbody>
            {todayList.map((t) => (
              <tr key={t.id}>
                <td>{t.date.toDate().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</td>
                <td>{t.label}</td><td>{t.buyer}</td>
                <td>{t.amount.toLocaleString("fr-FR")} F</td><td>{t.method}</td>
                {isSuperAdmin && <td><button className="ghost" onClick={() => handleDeleteTicket(t.id)}>Supprimer</button></td>}
              </tr>
            ))}
            {todayList.length === 0 && <tr><td colSpan={isSuperAdmin ? 6 : 5} className="empty">Aucune vente aujourd'hui.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}
