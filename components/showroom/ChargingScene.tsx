/**
 * The landing illustration: a car on the cable at a charging point.
 *
 * Flat, drawn in the same language as `BodyIcon` and the map — solid fills, no
 * gradients, no shadows, everything from the theme tokens so it follows the
 * palette rather than pinning its own colours.
 *
 * It replaces the three.js canvas that used to sit here. That render took
 * fifteen to twenty seconds to appear on this machine and showed a faceted
 * extruded body, which read as unfinished rather than as a product shot. A
 * drawing that is deliberately a drawing is the more honest thing to put on a
 * page whose whole argument is "we do not dress the numbers up".
 *
 * The plug is the point. Everything else on this page is about range and
 * waiting; the picture should say "this is what owning one looks like" before
 * a single figure does.
 */

type Props = {
  className?: string;
};

export function ChargingScene({ className = "" }: Props) {
  return (
    <svg
      viewBox="0 0 700 380"
      className={className}
      role="img"
      aria-label="Ein Auto lädt an einer Ladesäule."
      fill="none"
    >
      {/* Ground. A single line, not a shadow: the car stands somewhere, and
          that is all this needs to say. */}
      <line
        x1="22"
        y1="322"
        x2="678"
        y2="322"
        stroke="var(--color-line-strong)"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* ---- charging point ---- */}
      <rect x="52" y="300" width="86" height="12" rx="5" fill="var(--color-line-strong)" />
      <rect
        x="66"
        y="118"
        width="58"
        height="188"
        rx="16"
        fill="var(--color-surface)"
        stroke="var(--color-ink-soft)"
        strokeWidth="3"
      />
      {/* Screen */}
      <rect x="80" y="140" width="30" height="42" rx="5" fill="var(--color-ink-soft)" />
      {/* Charge indicator: three bars, the top one open, so it reads as
          "filling" rather than "full". */}
      <rect x="86" y="150" width="18" height="5" rx="2.5" fill="var(--color-surface)" />
      <rect x="86" y="160" width="18" height="5" rx="2.5" fill="var(--color-surface)" />
      <rect
        x="86"
        y="170"
        width="18"
        height="5"
        rx="2.5"
        fill="var(--color-surface)"
        opacity="0.35"
      />
      {/* Cable socket on the pillar */}
      <circle cx="95" cy="212" r="9" fill="var(--color-accent)" />

      {/* ---- cable ---- */}
      <path
        d="M104 216 C 128 232, 132 286, 168 272 L184 266"
        stroke="var(--color-accent-strong)"
        strokeWidth="7"
        strokeLinecap="round"
      />

      {/* ---- car ---- */}
      {/* Body. A compact estate profile: long flat roof, short overhangs. */}
      <path
        d="M188 288 L188 236 Q188 220 204 214 L252 198 Q272 154 318 154 L470 154
           Q512 156 536 196 L602 216 Q622 222 622 240 L622 288 Z"
        fill="var(--color-accent)"
      />
      {/* Greenhouse: one light shape, split by a pillar, rather than separate
          panes — at this size separate panes turn into noise. */}
      <path
        d="M266 198 L322 166 L462 166 L520 196 Z"
        fill="var(--color-accent-band)"
        opacity="0.45"
      />
      <rect x="386" y="166" width="9" height="32" fill="var(--color-accent)" />

      {/* Charge port, where the cable lands. */}
      <rect x="182" y="248" width="16" height="22" rx="4" fill="var(--color-accent-strong)" />

      {/* Light bar at the front */}
      <rect x="600" y="232" width="22" height="9" rx="4" fill="var(--color-accent-band)" />

      {/* Wheels. The pale outer disc is the arch: it punches a hole in the
          body so the wheel sits in the car rather than on top of it. */}
      <circle cx="272" cy="288" r="40" fill="var(--color-canvas)" />
      <circle cx="540" cy="288" r="40" fill="var(--color-canvas)" />
      <circle cx="272" cy="288" r="33" fill="var(--color-ink)" />
      <circle cx="540" cy="288" r="33" fill="var(--color-ink)" />
      <circle cx="272" cy="288" r="14" fill="var(--color-line-strong)" />
      <circle cx="540" cy="288" r="14" fill="var(--color-line-strong)" />
    </svg>
  );
}
