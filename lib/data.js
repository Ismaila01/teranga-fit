import {
  collection, addDoc, getDocs, query, where, orderBy,
  doc, updateDoc, deleteDoc, setDoc, getDoc, Timestamp, limit,
} from "firebase/firestore";
import { db, auth } from "./firebase";

const PLANS = {
  mensuel_sans: { label: "Mensuel sans tapis", days: 30, price: 20000 },
  mensuel_avec: { label: "Mensuel avec tapis", days: 30, price: 25000 },
};
export { PLANS };

// ---------- Journal d'activité ----------
const fmt = (ts) => ts.toDate().toLocaleDateString("fr-FR");

async function logAction(action, details = "") {
  try {
    const u = auth.currentUser;
    await addDoc(collection(db, "journal"), {
      at: Timestamp.now(), by: u ? u.email : "inconnu", action, details,
    });
  } catch (e) {
    console.error("Journal :", e);
  }
}

export async function listJournal(max = 300) {
  const snap = await getDocs(query(collection(db, "journal"), orderBy("at", "desc"), limit(max)));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function listSubscriptions() {
  const snap = await getDocs(query(collection(db, "subscriptions"), orderBy("startAt", "desc")));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function listAccessHistory(days = 7, max = 500) {
  const constraints = [];
  if (days) {
    const start = new Date(); start.setHours(0, 0, 0, 0); start.setDate(start.getDate() - (days - 1));
    constraints.push(where("in", ">=", Timestamp.fromDate(start)));
  }
  constraints.push(orderBy("in", "desc"), limit(max));
  const snap = await getDocs(query(collection(db, "checkins"), ...constraints));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// ---------- Membres ----------
export async function addMember({ name, phone, plan, method }) {
  const p = PLANS[plan];
  const now = Timestamp.now();
  const expires = Timestamp.fromMillis(now.toMillis() + p.days * 86400000);

  const memberRef = await addDoc(collection(db, "members"), {
    name, phone, plan, planLabel: p.label,
    createdAt: now, expiresAt: expires,
  });

  await addDoc(collection(db, "payments"), {
    memberId: memberRef.id, memberName: name,
    plan: p.label, amount: p.price, method,
    date: now,
  });

  await addDoc(collection(db, "subscriptions"), {
    memberId: memberRef.id, memberName: name, plan, planLabel: p.label,
    amount: p.price, method, startAt: now, endAt: expires,
  });

  await setDoc(doc(db, "passes", memberRef.id), { name, planLabel: p.label, startAt: now, endAt: expires });

  await logAction("Inscription membre",
    `${name} — ${p.label}, ${p.price.toLocaleString("fr-FR")} FCFA (${method}), valable jusqu'au ${fmt(expires)}`);

  return { id: memberRef.id, planLabel: p.label, startAt: now, endAt: expires };
}

export async function listMembers() {
  const snap = await getDocs(query(collection(db, "members"), orderBy("createdAt", "desc")));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function isMemberExpired(member) {
  return member.expiresAt.toMillis() < Date.now();
}

export async function listPayments(max = 20) {
  const snap = await getDocs(query(collection(db, "payments"), orderBy("date", "desc"), limit(max)));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ---------- Billetterie / caisse ----------
const TICKET_TYPES = {
  seance_sans: { label: "Séance sans tapis", price: 1500 },
  seance_avec: { label: "Séance avec tapis", price: 2000 },
};
export { TICKET_TYPES };

export async function sellTicket({ type, buyer, method }) {
  const t = TICKET_TYPES[type];
  await addDoc(collection(db, "tickets"), {
    label: t.label, buyer: buyer || "—", amount: t.price,
    method, date: Timestamp.now(),
  });
  await logAction("Vente ticket",
    `${t.label} — ${t.price.toLocaleString("fr-FR")} FCFA (${method})${buyer ? ", client : " + buyer : ""}`);
}

export async function listTicketsToday() {
  const start = new Date(); start.setHours(0, 0, 0, 0);
  const snap = await getDocs(query(
    collection(db, "tickets"),
    where("date", ">=", Timestamp.fromDate(start)),
    orderBy("date", "desc")
  ));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ---------- Accès / check-in ----------
export async function checkIn(member) {
  await addDoc(collection(db, "checkins"), {
    memberId: member.id, memberName: member.name,
    in: Timestamp.now(), out: null,
  });
}

export async function checkOut(checkinId) {
  await updateDoc(doc(db, "checkins", checkinId), { out: Timestamp.now() });
}

export async function listInside() {
  const snap = await getDocs(query(collection(db, "checkins"), where("out", "==", null)));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ---------- Relances (abonnements mensuels uniquement) ----------
export async function listUpcomingRenewals() {
  const members = await listMembers();
  const now = Date.now();
  const DAY = 86400000;
  return members.filter(m => {
    if (!(m.plan === "mois" || (m.plan || "").startsWith("mensuel"))) return false;
    const daysLeft = (m.expiresAt.toMillis() - now) / DAY;
    return daysLeft <= 3 && daysLeft >= 0;
  });
}

export async function updateMember(id, { name, phone, expiresAt }) {
  const ref = doc(db, "members", id);
  const before = (await getDoc(ref)).data() || {};
  await updateDoc(ref, { name, phone, expiresAt });
  try {
    await setDoc(doc(db, "passes", id), { name, endAt: expiresAt }, { merge: true });
  } catch (e) {
    console.error(e);
  }

  const changes = [];
  if (before.name !== name) changes.push(`nom : ${before.name} → ${name}`);
  if ((before.phone || "") !== (phone || "")) changes.push(`téléphone : ${before.phone || "—"} → ${phone || "—"}`);
  if (before.expiresAt && before.expiresAt.toMillis() !== expiresAt.toMillis()) {
    changes.push(`fin d'abonnement : ${fmt(before.expiresAt)} → ${fmt(expiresAt)}`);
    try {
      // garde l'historique des abonnements cohérent avec la nouvelle date
      const subs = await getDocs(query(collection(db, "subscriptions"), where("memberId", "==", id)));
      const latest = subs.docs.sort((a, b) => b.data().startAt.toMillis() - a.data().startAt.toMillis())[0];
      if (latest) await updateDoc(latest.ref, { endAt: expiresAt });
    } catch (e) {
      console.error(e);
    }
  }
  await logAction("Modification membre", `${name} — ${changes.join(" ; ") || "aucun changement"}`);
}

export async function deleteMember(id) {
  const ref = doc(db, "members", id);
  const snap = await getDoc(ref);
  const m = snap.exists() ? snap.data() : null;
  await deleteDoc(ref);
  try {
    await deleteDoc(doc(db, "passes", id));
  } catch (e) {
    console.error(e);
  }
  await logAction("Suppression membre", m ? `${m.name} (${m.planLabel}, fin ${fmt(m.expiresAt)})` : id);
}

export async function deleteTicket(id) {
  const ref = doc(db, "tickets", id);
  const snap = await getDoc(ref);
  const t = snap.exists() ? snap.data() : null;
  await deleteDoc(ref);
  await logAction("Suppression vente",
    t ? `${t.label} — ${t.amount.toLocaleString("fr-FR")} FCFA (${t.method}), client : ${t.buyer}` : id);
}

// ---------- Personnel (gérants / super admin) ----------
export async function listStaff() {
  const snap = await getDocs(collection(db, "users"));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function addStaff({ email, name, role }) {
  // Crée la fiche de rôle. Le compte de connexion (email + mot de passe)
  // doit être créé séparément dans Firebase Authentication > Users.
  await setDoc(doc(db, "users", email), { name, role, createdAt: Timestamp.now() });
  await logAction("Ajout compte", `${name} (${email}) — ${role === "superadmin" ? "Super admin" : "Gérant"}`);
}

export async function removeStaff(email) {
  await deleteDoc(doc(db, "users", email));
  await logAction("Retrait compte", email);
}

// Crée (ou met à jour) la fiche publique du ticket d'un membre.
export async function ensurePass(member) {
  await setDoc(doc(db, "passes", member.id), {
    name: member.name, planLabel: member.planLabel,
    startAt: member.createdAt, endAt: member.expiresAt,
  }, { merge: true });
}

// ---------- Statistiques pour le tableau de bord ----------
export async function revenueByDay(days = 7) {
  const start = new Date(); start.setHours(0, 0, 0, 0); start.setDate(start.getDate() - (days - 1));
  const ts = Timestamp.fromDate(start);
  const [p, t] = await Promise.all([
    getDocs(query(collection(db, "payments"), where("date", ">=", ts))),
    getDocs(query(collection(db, "tickets"), where("date", ">=", ts))),
  ]);
  const buckets = {};
  for (let i = 0; i < days; i++) {
    const d = new Date(start); d.setDate(start.getDate() + i);
    buckets[d.toDateString()] = { label: d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }), value: 0 };
  }
  [...p.docs, ...t.docs].forEach((docu) => {
    const x = docu.data();
    const key = x.date.toDate().toDateString();
    if (buckets[key]) buckets[key].value += x.amount;
  });
  return Object.values(buckets);
}

export async function methodBreakdown() {
  const start = new Date(); start.setDate(1); start.setHours(0, 0, 0, 0);
  const ts = Timestamp.fromDate(start);
  const [p, t] = await Promise.all([
    getDocs(query(collection(db, "payments"), where("date", ">=", ts))),
    getDocs(query(collection(db, "tickets"), where("date", ">=", ts))),
  ]);
  const sums = {};
  [...p.docs, ...t.docs].forEach((docu) => {
    const x = docu.data();
    sums[x.method] = (sums[x.method] || 0) + x.amount;
  });
  return Object.entries(sums).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
}

export async function listRecentCheckins(max = 6) {
  const snap = await getDocs(query(collection(db, "checkins"), orderBy("in", "desc"), limit(max)));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// ---------- Dashboard ----------
export async function monthRevenue() {
  const start = new Date(); start.setDate(1); start.setHours(0, 0, 0, 0);
  const ts = Timestamp.fromDate(start);

  const paySnap = await getDocs(query(collection(db, "payments"), where("date", ">=", ts)));
  const ticketSnap = await getDocs(query(collection(db, "tickets"), where("date", ">=", ts)));

  const payTotal = paySnap.docs.reduce((s, d) => s + d.data().amount, 0);
  const ticketTotal = ticketSnap.docs.reduce((s, d) => s + d.data().amount, 0);
  return payTotal + ticketTotal;
}
