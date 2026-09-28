import {
  collection, addDoc, getDocs, query, where, orderBy,
  doc, updateDoc, deleteDoc, setDoc, getDoc, Timestamp, limit,
} from "firebase/firestore";
import { db } from "./firebase";

const PLANS = {
  jour:   { label: "Jour",              days: 1,   price: 1500 },
  mois:   { label: "Mois",              days: 30,  price: 15000 },
  "6mois":{ label: "6 mois",            days: 180, price: 75000 },
  an:     { label: "1 an",              days: 365, price: 140000 },
  essai:  { label: "Séance d'essai",    days: 1,   price: 0 },
};
export { PLANS };

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

  return memberRef.id;
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
  seance: { label: "Ticket séance", price: 2000 },
  invite: { label: "Invité d'un membre", price: 1000 },
  cours:  { label: "Cours collectif", price: 2500 },
};
export { TICKET_TYPES };

export async function sellTicket({ type, buyer, method }) {
  const t = TICKET_TYPES[type];
  await addDoc(collection(db, "tickets"), {
    label: t.label, buyer: buyer || "—", amount: t.price,
    method, date: Timestamp.now(),
  });
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
    if (m.plan !== "mois") return false;
    const daysLeft = (m.expiresAt.toMillis() - now) / DAY;
    return daysLeft <= 3 && daysLeft >= 0;
  });
}

// ---------- Personnel (gérants / super admin) ----------
export async function listStaff() {
  const snap = await getDocs(collection(db, "users"));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function addStaff({ email, name, role }) {
  // Crée la fiche de rôle. Le compte de connexion (email + mot de passe)
  // doit être créé séparément dans Firebase Authentication > Users —
  // le SDK client ne peut pas créer de comptes pour quelqu'un d'autre.
  await setDoc(doc(db, "users", email), { name, role, createdAt: Timestamp.now() });
}

export async function removeStaff(email) {
  await deleteDoc(doc(db, "users", email));
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
