import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, ShoppingCart, Users, DoorOpen, BellRing, ShieldCheck, LogOut, Plus,
  CalendarClock, History, ScrollText, Menu,
} from "lucide-react";
import { logout, useAuth } from "../lib/auth";
import Logo from "./Logo";

const LINKS = [
  { href: "/", label: "Tableau de bord", short: "Accueil", Icon: LayoutDashboard },
  { href: "/caisse", label: "Caisse", short: "Caisse", Icon: ShoppingCart },
  { href: "/members", label: "Clients", short: "Clients", Icon: Users },
  { href: "/access", label: "Accès", short: "Accès", Icon: DoorOpen },
  { href: "/reminders", label: "Relances", short: "Relances", Icon: BellRing },
  { href: "/history", label: "Abonnements", short: "Abonnements", Icon: CalendarClock },
  { href: "/access-history", label: "Historique accès", short: "Hist. accès", Icon: History },
];

const MAIN_MOBILE = ["/", "/caisse", "/members", "/access"];

const TITLES = {
  "/": "Tableau de bord",
  "/caisse": "Caisse • Point de vente",
  "/members": "Clients",
  "/access": "Contrôle d'accès",
  "/reminders": "Relances",
  "/history": "Historique des abonnements",
  "/access-history": "Historique des accès",
  "/journal": "Journal d'activité",
  "/admin": "Super Admin",
};

export default function Layout({ children }) {
  const router = useRouter();
  const { user, role } = useAuth();
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => { setMoreOpen(false); }, [router.pathname]);

  const links = role === "superadmin"
    ? [
        ...LINKS,
        { href: "/journal", label: "Journal", short: "Journal", Icon: ScrollText },
        { href: "/admin", label: "Super Admin", short: "Super Admin", Icon: ShieldCheck },
      ]
    : LINKS;

  const mobileMain = links.filter((l) => MAIN_MOBILE.includes(l.href));
  const mobileMore = links.filter((l) => !MAIN_MOBILE.includes(l.href));
  const moreActive = mobileMore.some((l) => l.href === router.pathname);

  const today = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
  const name = user ? user.email.split("@")[0] : "";
  const roleLabel = role === "superadmin" ? "Super admin" : "Gérant";

  return (
    <div className="app">
      {/* Barre latérale (ordinateur / tablette) */}
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
            <small>{roleLabel}</small>
          </div>
          <button className="iconBtn" onClick={logout} title="Déconnexion"><LogOut size={16} /></button>
        </div>
      </aside>

      <div className="contentCol">
        <header className="topbar2">
          <div className="titleRow">
            <span className="mobileLogo"><Logo size={30} /></span>
            <div>
              <h1 className="pageTitle">{TITLES[router.pathname] || ""}</h1>
              <p className="pageDate">{today}</p>
            </div>
          </div>
          <div className="topActions">
            <span className="livePill"><i /> En ligne</span>
            <Link href="/caisse" className="primary ctaLink"><Plus size={16} /> <span className="ctaText">Nouvelle vente</span></Link>
          </div>
        </header>

        <motion.main key={router.pathname} className="pageWrap"
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          {children}
        </motion.main>
      </div>

      {/* Barre du bas (téléphone) */}
      <nav className="bottomBar">
        {mobileMain.map(({ href, short, Icon }) => (
          <Link key={href} href={href} className={"tabItem" + (router.pathname === href ? " active" : "")}>
            <Icon size={20} /><span>{short}</span>
          </Link>
        ))}
        <button className={"tabItem" + (moreActive || moreOpen ? " active" : "")} onClick={() => setMoreOpen((o) => !o)}>
          <Menu size={20} /><span>Plus</span>
        </button>
      </nav>

      <AnimatePresence>
        {moreOpen && (
          <motion.div key="backdrop" className="sheetBackdrop" onClick={() => setMoreOpen(false)}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
        )}
        {moreOpen && (
          <motion.div key="sheet" className="sheet"
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 36 }}>
            <div className="sheetHandle" />
            <div className="sheetUser">
              <div className="avatar">{name.charAt(0).toUpperCase()}</div>
              <div><b>{name}</b><small>{roleLabel}</small></div>
            </div>
            <div className="sheetGrid">
              {mobileMore.map(({ href, label, Icon }) => (
                <Link key={href} href={href} className={"sheetItem" + (router.pathname === href ? " active" : "")}>
                  <Icon size={18} /><span>{label}</span>
                </Link>
              ))}
            </div>
            <button className="sheetLogout" onClick={logout}><LogOut size={16} /> Déconnexion</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
