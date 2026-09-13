import type { BodyStyle } from "@/lib/engine/types";

/**
 * Side-profile silhouettes, one per body style.
 *
 * The reader this serves has never owned an electric car and is scanning a list
 * of names that mean nothing to them yet. A shape they can recognise in a
 * glance, small or estate or tall, does more than another line of text.
 *
 * Proportions come from BODY_DIMS in scripts/generate-car-glb.py, the same
 * table the 3D models are built from, scaled into one shared viewBox. A
 * crossover has to look taller than a hatch and a sedan longer, and the icons
 * must not disagree with the 3D about what a sedan is.
 *
 *   body        L     W     H      roof    deck
 *   hatch     4.26  1.81  1.56     0.66    hatch
 *   compact   4.40  1.84  1.60     0.68    hatch
 *   kombi     4.75  1.87  1.52     0.56    hatch (flat roof to a square tail)
 *   sedan     4.78  1.85  1.44     0.42    sedan (fastback)
 *   crossover 4.55  1.92  1.68     0.70    crossover (raised)
 *
 * Usage: <BodyIcon body={car.body} className="h-5 w-auto text-muted" />
 *
 * Filled with `currentColor`, so the caller sets the colour by CSS — the same
 * icon sits in a card, a table cell or a chip without a second variant.
 * `aria-hidden` by default: the car's name is always right next to it, so the
 * icon is decorative. Pass `title` for the rare case where it carries meaning
 * on its own.
 */

type Props = {
  body: BodyStyle;
  className?: string;
  /** Give the icon an accessible name. Omit it and the icon is decorative. */
  title?: string;
};

/**
 * One viewBox for all five, 120 wide by 48 high, ground line at y=42.
 * 1 metre ≈ 24 units, so the longest body (sedan, 4.78 m) fills the width and
 * the others sit shorter inside the same frame — the length difference is the
 * point, so nothing is normalised away.
 */
const VIEW_BOX = "0 0 120 48";

/** Path data: body outline first, then the two wheel arches cut as circles. */
const SHAPES: Record<BodyStyle, { body: string; wheels: [number, number][]; r: number }> = {
  // Short, upright, tall greenhouse. Cab-forward: the windscreen starts early.
  hatch: {
    body:
      "M14 42 L14 30 Q14 24 20 22 L30 18 Q36 13 46 13 L66 13 Q74 13 78 18 L88 22 " +
      "Q94 24 94 30 L94 42 Z",
    wheels: [
      [28, 42],
      [80, 42],
    ],
    r: 8,
  },
  // The hatch grown up: a little longer, a little taller, same upright tail.
  compact: {
    body:
      "M12 42 L12 29 Q12 23 18 21 L29 16 Q36 11 47 11 L70 11 Q79 11 83 16 L94 21 " +
      "Q100 23 100 29 L100 42 Z",
    wheels: [
      [27, 42],
      [85, 42],
    ],
    r: 8.5,
  },
  // Estate: sedan length, but the roof runs flat to a square tail instead of
  // falling away. Recognising a Kombi at icon size is that flat back half.
  kombi: {
    body:
      "M6 42 L6 31 Q6 26 12 24 L30 20 Q40 12 54 12 L98 12 Q106 12 108 16 " +
      "L112 24 Q116 26 116 31 L116 42 Z",
    wheels: [
      [24, 42],
      [96, 42],
    ],
    r: 8,
  },
  // Long, low, fastback: long bonnet, raked screen, roof sloping into the tail.
  sedan: {
    body:
      "M6 42 L6 31 Q6 26 12 24 L30 20 Q40 12 54 12 L72 12 Q86 13 96 20 L108 24 " +
      "Q114 26 114 31 L114 42 Z",
    wheels: [
      [24, 42],
      [96, 42],
    ],
    r: 8,
  },
  // Tall, short overhangs, high belt line: the roof sits noticeably higher.
  crossover: {
    body:
      "M12 42 L12 27 Q12 21 18 19 L28 14 Q34 8 46 8 L70 8 Q82 8 88 14 L98 19 " +
      "Q104 21 104 27 L104 42 Z",
    wheels: [
      [28, 42],
      [88, 42],
    ],
    r: 9.5,
  },
};

export function BodyIcon({ body, className = "", title }: Props) {
  const shape = SHAPES[body];
  const decorative = title === undefined;

  return (
    <svg
      viewBox={VIEW_BOX}
      className={className}
      fill="currentColor"
      role={decorative ? undefined : "img"}
      aria-hidden={decorative ? true : undefined}
      aria-label={decorative ? undefined : title}
      focusable="false"
    >
      {title !== undefined ? <title>{title}</title> : null}
      {/* Body and wheels share one path with evenodd, so the arches read as
          cut-outs rather than as a lighter shape painted on top — the icon
          then works on any background the caller puts it on. */}
      <path
        fillRule="evenodd"
        d={
          shape.body +
          shape.wheels
            .map(
              ([cx, cy]) =>
                ` M${cx - shape.r} ${cy} a${shape.r} ${shape.r} 0 1 0 ${shape.r * 2} 0 ` +
                `a${shape.r} ${shape.r} 0 1 0 ${-shape.r * 2} 0 Z`,
            )
            .join("")
        }
      />
      {/* Tyres, drawn under the arch cut-outs so a wheel reads as a wheel. */}
      {shape.wheels.map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={shape.r * 0.62} />
      ))}
    </svg>
  );
}
