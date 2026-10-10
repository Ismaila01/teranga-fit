export default function Logo({ size = 30 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="13" width="4" height="6" rx="1" fill="#6B7280" />
      <rect x="6" y="10" width="3.2" height="12" rx="1" fill="#1C1E25" />
      <rect x="9.2" y="14.5" width="13.6" height="3" rx="1.2" fill="#FF6A16" />
      <rect x="22.8" y="10" width="3.2" height="12" rx="1" fill="#1C1E25" />
      <rect x="27" y="13" width="4" height="6" rx="1" fill="#6B7280" />
    </svg>
  );
}
