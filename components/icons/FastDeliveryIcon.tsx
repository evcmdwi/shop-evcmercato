// components/icons/FastDeliveryIcon.tsx
export default function FastDeliveryIcon({ size = 16, color = '#16A34A' }: { size?: number; color?: string }) {
  return (
    <svg
      viewBox="0 0 32 20"
      width={size}
      height={size * 0.625}
      fill={color}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Motion lines (left side, behind motor) */}
      <rect x="0" y="7" width="6" height="1.5" rx="0.75" opacity="0.8"/>
      <rect x="0" y="10.5" width="8" height="1.5" rx="0.75" opacity="0.6"/>
      <rect x="0" y="14" width="5" height="1.5" rx="0.75" opacity="0.5"/>

      {/* Delivery box (behind rider) */}
      <rect x="9" y="5" width="5" height="5" rx="0.5"/>

      {/* Helmet (full-face) */}
      <ellipse cx="20" cy="4" rx="2.5" ry="2.5"/>
      {/* Visor strip */}
      <rect x="18" y="3.5" width="4" height="1" rx="0.3" fill="white"/>

      {/* Rider body - leaning forward */}
      <path d="M14.5 10 L17 6.5 L20 7.5 L22 10 L18 11.5 Z"/>

      {/* Scooter body */}
      <path d="M8 12 L10 10 L24 10 L26 12 L26 15 L8 15 Z"/>

      {/* Front wheel */}
      <circle cx="9.5" cy="17" r="3"/>
      <circle cx="9.5" cy="17" r="1.2" fill="white"/>

      {/* Rear wheel */}
      <circle cx="24.5" cy="17" r="3"/>
      <circle cx="24.5" cy="17" r="1.2" fill="white"/>

      {/* Handlebar */}
      <line x1="10" y1="11" x2="8" y2="9" stroke={color} strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  )
}
