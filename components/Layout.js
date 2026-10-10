import Link from "next/link";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { LayoutDashboard, ShoppingCart, Users, DoorOpen, BellRing, ShieldCheck, LogOut, Plus } from "lucide-react";
import { logout, useAuth } from "../lib/auth";
import Logo from "./Logo";

const LINKS = [
  { href: "/", label: "Tableau de bord", Icon: LayoutDashboard },
  { href: "/caisse", label: "Caisse", Icon: ShoppingCart },
  { href: "/members", label: "Clients", Icon: Users },
  { href: "/access", label: "Accès", Icon: DoorOpen },
  { href: "/reminders", label: "Relances", Icon: BellRing },
];

const TITLES = {
  "/": "Tableau de bord",
  "/caisse": "Caisse • Point de vente",
  "/members": "Clients",
  "/access": "Contrôle d'accès",
  "/reminders": "Relances",
  "/admin": "Super Admin",
};

export default function Layout({ children }) {
  const router = useRouter();
  const { user, role } = useAuth();

  const links = role === "superadmin"
    ? [...LINKS, { href: "/admin", label: "Super Admin", Icon: ShieldCheck }]
    : LINKS;

  const today = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
  const name = user ? user.email.split("@")[0] : "";

  return (
    <div className="app">
      <aside className="sidebar glass">
        <div className="sideBrand">
          <Logo size={34} />
          <div>
            <div className="brand">TERANGA<span>FIT</span></div>
            <div className="brandSub">Gestion de salle</div>
          </div>
        </div>

        <p className="sideLabel">Menu</p>
        <nav className="sideNav">
          {links.map(({ href, label, Icon }) => {
            const active = router.pathname === href;
            return (
              <Link key={href} href={href} className={"sideLink" + (active ? " active" : "")}>
                {active && (
                  <motion.span layoutId="activePill" className="activePill"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }} />
                )}
                <Icon size={18} />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="sideUser">
          <div className="avatar">{name.charAt(0).toUpperCase()}</div>
          <div className="sideUserText">
            <b>{name}</b>
            <small>{role === "superadmin" ? "Super admin" : "Gérant"}</small>
          </div>
          <button className="iconBtn" onClick={logout} title="Déconnexion"><LogOut size={16} /></button>
        </div>
      </aside>

      <div className="contentCol">
        <header className="topbar2">
          <div>
            <h1 className="pageTitle">{TITLES[router.pathname] || ""}</h1>
            <p className="pageDate">{today}</p>
          </div>
          <div className="topActions">
            <span className="livePill"><i /> En ligne</span>
            <Link href="/caisse" className="primary ctaLink"><Plus size={16} /> Nouvelle vente</Link>
          </div>
        </header>

        <motion.main key={router.pathname} className="pageWrap"
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          {children}
        </motion.main>
      </div>
    </div>
  );
}
