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
      <header className="banner">
        <div className="bannerLeft">
          <div className="brandRow">
            <Logo size={44} />
            <div>
              <div className="brand bannerBrand">TERANGA<span>FIT</span></div>
              <div className="brandSub">Salle de sport • Gestion</div>
            </div>
          </div>
          <div className="bannerSlogan">
            <p className="eyebrow">Dépasse tes limites</p>
            <h1>FORGE TON CORPS,<br />PILOTE TA SALLE</h1>
          </div>
          <nav className="pillNav">
            {links.map((l) => (
              <Link key={l.href} href={l.href}
                className={"pillLink" + (router.pathname === l.href ? " active" : "")}>
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="bannerArt bannerPhotos">
          <img src="/images/athlete-curl.jpg" alt="Musculation aux haltères" />
          <img src="/images/athlete-row.jpg" alt="Coach à l'entraînement" />
        </div>
        <div className="profileBox bannerProfile">
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
