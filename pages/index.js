import { useEffect, useState } from "react";
import { listMembers, listPayments, listInside, monthRevenue, isMemberExpired } from "../lib/data";

export default function Dashboard() {
  const [stats, setStats] = useState({ active: 0, expired: 0, revenue: 0, inside: 0 });
  const [payments, setPayments] = useState([]);

  useEffect(() => { load(); }, []);

  async function load() {
    const members = await listMembers();
    const inside = await listInside();
    const revenue = await monthRevenue();
    let active = 0, expired = 0;
    for (const m of members) (await isMemberExpired(m)) ? expired++ : active++;
    setStats({ active, expired, revenue, inside: inside.length });
    setPayments(await listPayments(8));
  }

  return (
    <section>
      <div className="hero">
        <p className="eyebrow">Tableau de bord</p>
        <h1>PRENDS LE CONTRÔLE<br/>DE TA SALLE</h1>
        <div className="bar" />
        <p>Membres, caisse et fréquentation en un coup d'œil — tout ce qu'il te faut pour piloter la salle au quotidien.</p>
      </div>
      <div className="grid4">
        <div className="stat teal"><div className="icon">✅</div><b>{stats.active}</b><span>Membres actifs</span></div>
        <div className="stat red"><div className="icon">⛔</div><b>{stats.expired}</b><span>Abonnements expirés</span></div>
        <div className="stat gold"><div className="icon">💰</div><b>{stats.revenue.toLocaleString("fr-FR")}</b><span>CA du mois (FCFA)</span></div>
        <div className="stat"><div className="icon">🏋️</div><b>{stats.inside}</b><span>Présents dans la salle</span></div>
      </div>
      <div className="card">
        <h3>Derniers paiements</h3>
        <table>
          <thead><tr><th>Membre</th><th>Formule</th><th>Montant</th><th>Moyen</th></tr></thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.id}>
                <td>{p.memberName}</td><td>{p.plan}</td>
                <td>{p.amount.toLocaleString("fr-FR")} F</td><td>{p.method}</td>
              </tr>
            ))}
            {payments.length === 0 && <tr><td colSpan={4} className="empty">Aucun paiement encore.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}
