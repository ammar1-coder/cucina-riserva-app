export default function Logo({ size = 44, animated = false }) {
  return (
    <svg className={animated ? "mark" : ""} width={size} height={size} viewBox="0 0 64 64" fill="none">
      <circle className={animated ? "mark-ring" : ""} cx="32" cy="32" r="27" stroke="#C9A227" strokeWidth="1" fill="none" />
      <circle className={animated ? "mark-ring2" : ""} cx="32" cy="32" r="22.5" stroke="#C9A227" strokeWidth="0.6" fill="none" opacity="0.55" />
      <path className={animated ? "mark-diamond" : ""} d="M32 5.5L34.4 9.5L32 13.5L29.6 9.5Z" fill="#C9A227" />
      <path className={animated ? "mark-diamond" : ""} d="M32 50.5L34.4 54.5L32 58.5L29.6 54.5Z" fill="#C9A227" />
      <text className={animated ? "mark-glyph" : ""} x="32" y="40" textAnchor="middle"
        fontFamily="'Cormorant Garamond', serif" fontSize="24" fontWeight="600" letterSpacing="0.5"
        fill="#C9A227">CR</text>
    </svg>
  );
}
