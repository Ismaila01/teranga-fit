import Link from "next/link";
import { useRouter } from "next/router";
import { logout, useAuth } from "../lib/auth";
import Logo from "./Logo";

const LINKS = [
  { href: "/", label: "📊 Tableau de bord" },
  { href: "/members", label: "👥 Membres" },
  { href: "/access", label: "🚪 Accès" },
  { href: "/caisse", label: "🎟️ Billetterie & Caisse" },
  { href: "/reminders", label: "💬 Relances" },
];

export default function Layout({ children }) {
  const router = useRouter();
  const { user, role } = useAuth();

  const links = role === "superadmin"
    ? [...LINKS, { href: "/admin", label: "🛡️ Super Admin" }]
    : LINKS;

  return (
    <div className="shell">
      <nav className="nav">
        <div className="brandRow">
          <Logo />
          <div className="brand">TERANGA<span>FIT</span></div>
        </div>
        {links.map((l) => (
          <Link key={l.href} href={l.href}
            className={"navbtn" + (router.pathname === l.href ? " active" : "")}>
            {l.label}
          </Link>
        ))}
        {user && (
          <button className="navbtn logout" onClick={logout}>🚪 Déconnexion</button>
        )}
      </nav>
      <main className="main">{children}</main>
    </div>
  );
}
