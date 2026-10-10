import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import QrCode from "../../components/QrCode";
import Logo from "../../components/Logo";
import { qrPayload } from "../../lib/ticket";
import { GYM } from "../../lib/config";

const fmt = (ts) => ts.toDate().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

export default function PublicTicket() {
  const router = useRouter();
  const { id } = router.query;
  const [pass, setPass] = useState(undefined); // undefined = chargement, null = introuvable

  useEffect(() => {
    if (!id) return;
    getDoc(doc(db, "passes", id))
      .then((s) => setPass(s.exists() ? s.data() : null))
      .catch(() => setPass(null));
  }, [id]);

  const valid = pass && pass.endAt.toMillis() >= Date.now();

  return (
    <div className="ticketPage">
      <div className="passCard">
        <div className="brandRow"><Logo size={34} /><div className="brand">{GYM.name.toUpperCase()}</div></div>

        {pass === undefined && <p className="sub" style={{ marginTop: 24 }}>Chargement…</p>}
        {pass === null && <p className="sub" style={{ marginTop: 24 }}>Ticket introuvable. Demande un nouveau lien à l'accueil.</p>}

        {pass && (
          <>
            <p className="passLabel">TICKET D'ACCÈS</p>
            <h2 className="passName">{pass.name}</h2>
            <p className="passPlan">{pass.planLabel}</p>
            <QrCode value={qrPayload(id)} size={230} />
            <span className={"tag " + (valid ? "ok" : "exp")}>{valid ? "Abonnement valide" : "Abonnement expiré"}</span>
            <div className="passDates">
              <div><small>Début</small><b>{fmt(pass.startAt)}</b></div>
              <div><small>Fin</small><b>{fmt(pass.endAt)}</b></div>
            </div>
            <p className="passHint">Présente ce QR code à l'accueil pour entrer.</p>
          </>
        )}
      </div>
    </div>
  );
}
