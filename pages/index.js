import { useEffect, useState } from "react";
import { motion, animate } from "framer-motion";
import { Users, UserX, Wallet, Dumbbell } from "lucide-react";
import {
  listMembers, listPayments, listInside, monthRevenue,
  revenueByDay, methodBreakdown, listRecentCheckins,
} from "../lib/data";

const COLORS = ["#FF4438", "#2FD1D9", "#F2A93B", "#8B8FA3"];

function Counter({ value }) {
  const [text, setText] = useState("0");
  useEffect(() => {
    const controls = animate(0, value, {
      duration: 1.2, ease: "easeOut",
      onUpdate: (v) => setText(Math.round(v).toLocaleString("fr-FR")),
    });
    return () => controls.stop();
  }, [value]);
  return <span>{text}</span>;
}

function StatCard({ title, value, sub, Icon, tone, delay }) {
  return (
    <motion.div className={"glass stat " + tone} whileHover={{ y: -5 }}
      initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay }}>
      <div className="statTop"><span>{title}</span><div className="statIcon"><Icon size={18} /></div></div>
      <b><Counter value={value} /></b>
      <small>{sub}</small>
    </motion.div>
  );
}

function LineChart({ data }) {
  const W = 560, H = 200, P = 26;
  const max = Math.max(1, ...data.map((d) => d.value));
  const n = data.length;
  const pts = data.map((d, i) => ({
    x: P + (n > 1 ? (i * (W - 2 * P)) / (n - 1) : 0),
    y: H - P - (d.value / max) * (H - 2 * P),
  }));
  let line = pts.length ? `M ${pts[0].x} ${pts[0].y}` : "";
  for (let i = 1; i < pts.length; i++) {
    const cx = (pts[i - 1].x + pts[i].x) / 2;
    line += ` C ${cx} ${pts[i - 1].y}, ${cx} ${pts[i].y}, ${pts[i].x} ${pts[i].y}`;
  }
  const area = pts.length ? `${line} L ${pts[pts.length - 1].x} ${H - P} L ${pts[0].x} ${H - P} Z` : "";
  const step = Math.ceil(n / 7);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="lineChart" key={n}>
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FF4438" stopOpacity="0.38" />
          <stop offset="100%" stopColor="#FF4438" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 1, 2, 3].map((i) => (
        <line key={i} x1={P} x2={W - P} y1={P + (i * (H - 2 * P)) / 3} y2={P + (i * (H - 2 * P)) / 3}
          stroke="rgba(20,24,40,0.09)" strokeDasharray="4 6" />
      ))}
      <motion.path d={area} fill="url(#areaGrad)" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.5 }} />
      <motion.path d={line} fill="none" stroke="#FF4438" strokeWidth="3" strokeLinecap="round"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.3, ease: "easeInOut" }} />
      {pts.map((p, i) => (
        <motion.circle key={i} cx={p.x} cy={p.y} r="4" fill="#FFFFFF" stroke="#FF4438" strokeWidth="2"
          initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.6 + i * 0.04 }} />
      ))}
      {data.map((d, i) => (i % step === 0) && (
        <text key={i} x={pts[i].x} y={H - 6} textAnchor="middle" fontSize="10" fill="#667085">{d.label}</text>
      ))}
      <text x={P} y={14} fontSize="10" fill="#667085">max {max.toLocaleString("fr-FR")} F</text>
    </svg>
  );
}

function Donut({ items }) {
  const total = items.reduce((s, i) => s + i.value, 0);
  const R = 52, C = 2 * Math.PI * R;
  let offset = 0;
  const top = items[0];
  return (
    <div className="donutWrap">
      <svg viewBox="0 0 140 140" className="donut">
        <circle cx="70" cy="70" r={R} fill="none" stroke="rgba(20,24,40,0.09)" strokeWidth="14" />
        {total > 0 && items.map((it, i) => {
          const len = (it.value / total) * C;
          const el = (
            <motion.circle key={it.label} cx="70" cy="70" r={R} fill="none" stroke={COLORS[i % COLORS.length]}
              strokeWidth="14" strokeLinecap="butt" transform="rotate(-90 70 70)" strokeDashoffset={-offset}
              initial={{ strokeDasharray: `0 ${C}` }} animate={{ strokeDasharray: `${Math.max(len - 2, 0)} ${C - Math.max(len - 2, 0)}` }}
              transition={{ duration: 1.1, delay: 0.2 + i * 0.15 }} />
          );
          offset += len;
          return el;
        })}
        <text x="70" y="68" textAnchor="middle" fontSize="22" fontWeight="800" fill="#14161B">
          {total > 0 ? Math.round((top.value / total) * 100) + "%" : "—"}
        </text>
        <text x="70" y="84" textAnchor="middle" fontSize="9" fill="#667085">{total > 0 ? top.label : "Aucune vente"}</text>
      </svg>
      <ul className="legend">
        {items.map((it, i) => (
          <li key={it.label}>
            <i style={{ background: COLORS[i % COLORS.length] }} />
            <span>{it.label}</span>
            <b>{total ? Math.round((it.value / total) * 100) : 0}%</b>
          </li>
        ))}
        {items.length === 0 && <li className="empty">Pas encore de paiements ce mois-ci.</li>}
      </ul>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState({ active: 0, expired: 0, total: 0, revenue: 0, inside: 0 });
  const [payments, setPayments] = useState([]);
  const [chart, setChart] = useState([]);
  const [range, setRange] = useState(7);
  const [methods, setMethods] = useState([]);
  const [checkins, setCheckins] = useState([]);

  async function load() {
    const [members, inside, revenue, pays, meth] = await Promise.all([
      listMembers(), listInside(), monthRevenue(), listPayments(6), methodBreakdown(),
    ]);
    const expired = members.filter((m) => m.expiresAt.toMillis() < Date.now()).length;
    setStats({ active: members.length - expired, expired, total: members.length, revenue, inside: inside.length });
    setPayments(pays);
    setMethods(meth);
  }
  async function loadLive() { setCheckins(await listRecentCheckins(6)); }

  useEffect(() => {
    load(); loadLive();
    const id = setInterval(() => { loadLive(); }, 15000);
    return () => clearInterval(id);
  }, []);
  useEffect(() => { revenueByDay(range).then(setChart); }, [range]);

  return (
    <section>
      <div className="statGrid">
        <StatCard title="Membres actifs" value={stats.active} sub={`${stats.total} membres au total`} Icon={Users} tone="red" delay={0} />
        <StatCard title="Abonnements expirés" value={stats.expired} sub="À relancer ou renouveler" Icon={UserX} tone="amber" delay={0.08} />
        <StatCard title="CA du mois (FCFA)" value={stats.revenue} sub="Abonnements + tickets" Icon={Wallet} tone="cyan" delay={0.16} />
        <StatCard title="Présents maintenant" value={stats.inside} sub="Actuellement dans la salle" Icon={Dumbbell} tone="green" delay={0.24} />
      </div>

      <div className="dashRow2">
        <motion.div className="glass panel" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <div className="panelHead">
            <h3>Performance & recettes</h3>
            <div className="tabs">
              {[7, 30].map((d) => (
                <button key={d} className={"tab" + (range === d ? " on" : "")} onClick={() => setRange(d)}>{d} jours</button>
              ))}
            </div>
          </div>
          <LineChart data={chart} />
        </motion.div>

        <motion.div className="glass panel" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38 }}>
          <div className="panelHead"><h3>Moyens de paiement</h3></div>
          <Donut items={methods} />
        </motion.div>
      </div>

      <div className="dashRow3">
        <motion.div className="glass panel" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.46 }}>
          <div className="panelHead"><h3>Derniers paiements</h3></div>
          <table>
            <thead><tr><th>Membre</th><th>Formule</th><th>Montant</th><th>Moyen</th></tr></thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id}>
                  <td>{p.memberName}</td><td>{p.plan}</td>
                  <td>{p.amount.toLocaleString("fr-FR")} F</td>
                  <td><span className="tag neutral">{p.method}</span></td>
                </tr>
              ))}
              {payments.length === 0 && <tr><td colSpan={4} className="empty">Aucun paiement encore.</td></tr>}
            </tbody>
          </table>
        </motion.div>

        <motion.div className="glass panel" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.54 }}>
          <div className="panelHead"><h3>Journal d'accès</h3><span className="livePill"><i /> En direct</span></div>
          <ul className="logList">
            {checkins.map((c, i) => (
              <motion.li key={c.id} initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 + i * 0.06 }}>
                <div className="avatar sm">{c.memberName.charAt(0).toUpperCase()}</div>
                <div className="logText"><b>{c.memberName}</b>
                  <small>{c.in.toDate().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</small></div>
                <span className={"tag " + (c.out ? "neutral" : "ok")}>{c.out ? "Sorti" : "Dans la salle"}</span>
              </motion.li>
            ))}
            {checkins.length === 0 && <li className="empty">Aucun passage enregistré.</li>}
          </ul>
        </motion.div>
      </div>
    </section>
  );
}
