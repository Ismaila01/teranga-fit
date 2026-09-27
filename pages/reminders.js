import { useEffect, useState } from "react";
import { listUpcomingRenewals } from "../lib/data";

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
        <p className="sub">Membres avec un abonnement mensuel dont l'échéance arrive dans 3 jours ou moins</p>
      </div>

      <div className="card">
        {members.map((m) => {
          const daysLeft = Math.ceil((m.expiresAt.toMillis() - Date.now()) / 86400000);
          const firstName = m.name.split(" ")[0];
          return (
            <div key={m.id} className="reminderRow">
              <b>{m.name}</b> — expire le {m.expiresAt.toDate().toLocaleDateString("fr-FR")}
              <div className="wa">
                💬 WhatsApp : "Salam {firstName}, ton abonnement {m.planLabel} finit dans {daysLeft} jour(s). Passe à la salle pour renouveler 💪"
              </div>
            </div>
          );
        })}
        {members.length === 0 && <p className="empty">Aucune relance à envoyer aujourd'hui.</p>}
      </div>
    </section>
  );
}
