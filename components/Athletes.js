export default function Athletes() {
  const body = "#F3F1EC";
  const limb = { stroke: body, strokeWidth: 13, strokeLinecap: "round", strokeLinejoin: "round", fill: "none" };
  const limb2 = { ...limb, stroke: "#FF6A5E" };
  const dumbbell = (cx, cy) => (
    <g key={cx + "-" + cy}>
      <rect x={cx - 13} y={cy - 3} width="26" height="6" rx="2" fill="#8D9099" />
      <rect x={cx - 17} y={cy - 9} width="6" height="18" rx="2" fill="#17181B" />
      <rect x={cx + 11} y={cy - 9} width="6" height="18" rx="2" fill="#17181B" />
    </g>
  );
  return (
    <svg viewBox="0 0 420 210" className="athletes" role="img" aria-label="Deux athlètes qui font de la musculation">
      <defs>
        <radialGradient id="glow" cx="50%" cy="60%" r="60%">
          <stop offset="0%" stopColor="#FF4438" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#FF4438" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="210" cy="120" rx="200" ry="90" fill="url(#glow)" />
      <line x1="10" y1="196" x2="410" y2="196" stroke="#FF4438" strokeOpacity="0.5" strokeWidth="2" />

      {/* Athlète 1 : curls avec haltères */}
      <circle cx="120" cy="48" r="15" fill={body} />
      <path d="M92 72 L148 72 L134 132 L106 132 Z" fill={body} />
      <path d="M112 132 L104 192" {...limb} />
      <path d="M128 132 L136 192" {...limb} />
      <path d="M92 76 L82 110 L94 86" {...limb} />
      <path d="M148 76 L158 110 L146 86" {...limb} />
      {dumbbell(94, 82)}
      {dumbbell(146, 82)}

      {/* Athlète 2 : développé avec barre chargée */}
      <circle cx="292" cy="66" r="15" fill="#FF6A5E" />
      <path d="M264 90 L320 90 L306 148 L278 148 Z" fill="#FF6A5E" />
      <path d="M284 148 L274 192" {...limb2} />
      <path d="M300 148 L312 192" {...limb2} />
      <path d="M264 94 L248 66 L252 34" {...limb2} />
      <path d="M320 94 L336 66 L332 34" {...limb2} />
      <line x1="196" y1="32" x2="388" y2="32" stroke="#8D9099" strokeWidth="5" strokeLinecap="round" />
      <rect x="204" y="8" width="9" height="48" rx="2" fill="#17181B" />
      <rect x="216" y="14" width="7" height="36" rx="2" fill="#2A2D34" />
      <rect x="371" y="8" width="9" height="48" rx="2" fill="#17181B" />
      <rect x="361" y="14" width="7" height="36" rx="2" fill="#2A2D34" />
    </svg>
  );
}
