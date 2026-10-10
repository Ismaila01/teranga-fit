import { GYM } from "./config";

// Contenu du QR code d'un membre : "TFIT:" + identifiant du membre
export const qrPayload = (memberId) => "TFIT:" + memberId;

export function parseQr(text) {
  const t = (text || "").trim();
  return t.startsWith("TFIT:") ? t.slice(5) : null;
}

// Lien public du ticket (à appeler côté navigateur uniquement)
export const passUrl = (memberId) => `${window.location.origin}/ticket/${memberId}`;

// Lien WhatsApp avec message pré-rempli. Sans numéro valide, WhatsApp laisse choisir le contact.
export function whatsappLink(phone, text) {
  const digits = (phone || "").replace(/\D/g, "");
  let n = digits.startsWith("00") ? digits.slice(2) : digits;
  if (n.length === 9) n = "221" + n; // numéro sénégalais sans indicatif
  const base = n.length >= 11 ? `https://wa.me/${n}` : "https://wa.me/";
  return `${base}?text=${encodeURIComponent(text)}`;
}

export function ticketMessage({ name, planLabel, endAt, link }) {
  const first = (name || "").split(" ")[0];
  const date = endAt.toDate().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  return (
    `Salam ${first} 👋\n` +
    `Bienvenue chez ${GYM.name} !\n` +
    `Ton abonnement ${planLabel} est actif jusqu'au ${date}.\n\n` +
    `Voici ton ticket avec ton QR code. Présente-le à l'accueil pour entrer :\n${link}`
  );
}
