import { useEffect, useState } from "react";
import { listUpcomingRenewals } from "../lib/data";
import { whatsappLink } from "../lib/ticket";
import { GYM } from "../lib/config";

export default function Reminders() {
  const [members, setMembers] = useState([]);

  useEffect(() => {
    listUpcomingRenewals().then(setMembers);
  }, []);

  return (
    <section>
      <div className="pageHead">
        <p className="eyebrow">Fidélisation</p>
        <h2>RELANCES</h2>
        <div className="bar" />
        <p className="sub">Abonnements mensuels qui se terminent dans 3 jours ou moins</p>
      </div>

      <div className="card">
        {members.map((m) => {
          const daysLeft = Math.ceil((m.expiresAt.toMillis() - Date.now()) / 86400000);
          const firstName = m.name.split(" ")[0];
          const when = daysLeft <= 0 ? "aujourd'hui" : daysLeft === 1 ? "demain" : `dans ${daysLeft} jours`;
          const text = `Salam ${firstName}, ton abonnement ${m.planLabel} finit ${when}. Passe à ${GYM.name} pour le renouveler 💪`;
          return (
            <div key={m.id} className="reminderRow">
              <b>{m.name}</b> — expire le {m.expiresAt.toDate().toLocaleDateString("fr-FR")}
              <div className="wa">💬 {text}</div>
              <a className="primary ctaLink" style={{ marginTop: 10 }} href={whatsappLink(m.phone, text)} target="_blank" rel="noreferrer">
                Envoyer sur WhatsApp
              </a>
            </div>
          );
        })}
        {members.length === 0 && <p className="empty">Aucune relance à envoyer aujourd'hui.</p>}
      </div>
    </section>
  );
}
