import Link from "next/link";
import { useRouter } from "next/router";
import { logout, useAuth } from "../lib/auth";
import Logo from "./Logo";

const LINKS = [
  { href: "/", label: "Tableau de bord" },
  { href: "/caisse", label: "Caisse" },
  { href: "/members", label: "Clients" },
  { href: "/access", label: "Accès" },
  { href: "/reminders", label: "Relances" },
];

export default function Layout({ children }) {
  const router = useRouter();
  const { user, role } = useAuth();

  const links = role === "superadmin"
    ? [...LINKS, { href: "/admin", label: "Super Admin" }]
    : LINKS;

  return (
    <div className="appShell">
      <header className="topbar">
        <div className="brandRow">
          <Logo />
          <div>
            <div className="brand">TERANGA<span>FIT</span></div>
            <div className="brandSub">Gestion • Point de Vente</div>
          </div>
        </div>
        <nav className="pillNav">
          {links.map((l) => (
            <Link key={l.href} href={l.href}
              className={"pillLink" + (router.pathname === l.href ? " active" : "")}>
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="profileBox">
          {user && (
            <>
              <span className="profileName">{user.email.split("@")[0]}</span>
              <span className="dot" /> Connecté
              <button className="navbtn logout" onClick={logout}>Déconnexion</button>
            </>
          )}
        </div>
      </header>
      <main className="mainPage">{children}</main>
    </div>
  );
}
