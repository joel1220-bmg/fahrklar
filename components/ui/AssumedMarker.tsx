/**
 * A small state tag: "you told us this" vs "we guessed this."
 *
 * Colour cannot carry that distinction alone (WCAG 1.4.1). `--color-assumed`
 * is tuned to clear 4.5:1 against both `--color-surface` and `--color-canvas`
 * (measured 5.96:1 / 5.41:1 - see the token comment in globals.css), but a
 * reader who can't perceive the hue step from `--color-ink` - colour-blind,
 * a washed-out screen, print, a screen reader - still needs a way to tell
 * the two states apart. This primitive backs the colour with two more
 * channels that survive all of those: a glyph whose *shape* differs (a
 * tilde vs a check, not a colour swap), and visible text.
 *
 * Pure UI: two strings and a boolean in, markup out. It does not import
 * lib/copy.ts - pass the locked copy in as props (`COPY.assumedTag`,
 * `COPY.enteredTag`) so this file stays reusable outside the advisor flow
 * and copy-guard's wording stays owned in exactly one place. It also does
 * not style the value itself - keep `--color-assumed` / italics on the
 * value in the caller, this component only renders the tag next to it.
 */
export function AssumedMarker({
  assumed,
  assumedLabel,
  enteredLabel,
  className = "",
}: {
  /** true: the engine guessed this value. false: the reader entered it. */
  assumed: boolean;
  /** Visible + accessible text for the assumed state, e.g. `COPY.assumedTag`
   *  ("Angenommen"). Required - this is the state that most needs calling
   *  out, and the one the whole product's honesty claim rests on. */
  assumedLabel: string;
  /** Visible + accessible text for the entered state, e.g. `COPY.enteredTag`
   *  ("Eingegeben"). Optional: omit to render nothing when `assumed` is
   *  false, since "you told us this" is the default a reader expects and
   *  doesn't always need its own tag. Pass it wherever the two states
   *  should stand side by side and read as equally explicit (e.g. a legend,
   *  or a control that toggles between them). */
  enteredLabel?: string;
  /** Extra classes on the tag's own wrapper, e.g. spacing from the value it
   *  sits next to. Never used to change its colour - that stays derived
   *  from `assumed` so it can't drift from the token audit above. */
  className?: string;
}) {
  const label = assumed ? assumedLabel : enteredLabel;
  if (!label) return null;

  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded border px-1.5 py-0.5 text-xs leading-none ${
        assumed ? "border-line-strong text-assumed" : "border-line text-muted"
      } ${className}`}
    >
      <svg aria-hidden viewBox="0 0 8 8" className="h-2 w-2 shrink-0">
        {assumed ? (
          /* A tilde: "approximately", the shape of a guess. */
          <path
            d="M1 5c.7-2 1.6-2 2.3 0s1.6 2 2.3 0"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.1"
            strokeLinecap="round"
          />
        ) : (
          /* A check: "confirmed", the shape of something you said. */
          <path
            d="M1.5 4.2l1.8 1.8L6.5 2.4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
      </svg>
      {label}
    </span>
  );
}
