@AGENTS.md

# Fahrklar — working agreement

Orientation for buying a **new electric car** in Germany. Honest Autobahn range
as a span — month, speed, temperature — against WLTP's laboratory number.
No selling, no leasing comparison, no certified advice.

The whole product is one claim: **we tell you what we do not know.** Every
number is a range, every assumed value is marked as assumed. A screen that
prints a confident single figure has broken the product, not just the design.

## Who this is for

Someone who has **never owned an electric car** and does not know what to
expect. They are not comparing trim levels; they are trying to find out whether
this works for their life at all, and which handful of models are worth a closer
look. **Long distance is the thing they are anxious about** — that is where the
fear lives and where the laboratory figure misleads most.

Two consequences that outrank any design preference:

- **Explain, do not just display.** A figure the reader cannot interpret is
  worse than no figure: it looks like information and carries none. "77 kWh"
  means nothing to a beginner; "reicht im Winter für rund 300 km Autobahn"
  does. Where a technical term is unavoidable, the sentence that explains it
  travels with it.
- **The answer to "what should I expect?" comes before the answer to "which
  car?"** Someone who leaves knowing what a winter Autobahn trip actually looks
  like has been served, even if they pick no car at all.

---

## Layout

```
app/                 routes: / (landing), /berater, /datenschutz, /impressum
components/advisor/  the journey: questions, control bar, result
components/showroom/ the car canvas, materials, the route map
components/ui/       shared primitives — chips, fields, range bars
lib/engine/          the calculation. Pure. No I/O, no LLM, no Date.now()
lib/copy.ts          German product language, locked
data/                seed JSON: cars, climate, routes. Every file carries asOf
scripts/             the GLB generator (trimesh; no Blender on this machine)
```

## The loop

```bash
pwsh ./verify.ps1 -Quick     # types + 83 tests, ~15 s, run constantly
pwsh ./verify.ps1            # adds lint + production build
npx next dev -p 3001         # then actually look at it
```

Looking at the page is part of the loop, not an optional last step. Two of the
three worst bugs so far were invisible in the code and obvious on screen.

## Rules that are not style preferences

1. **Ranges are the product.** If a bound cannot be defended, widen it. Never
   narrow a span to look more competent — that is the one dishonesty this app
   cannot afford.

2. **An assumed value is marked where it can be corrected.** Not in a footnote,
   not in a drawer. The control holding the assumption says so itself.

3. **The engine is pure and reproducible.** No I/O, no `eval`, no LLM, no
   `Date.now()` inside the calculation. Same inputs, same output, always.

4. **Copy lives in `lib/copy.ts` and is locked.** `intake-lock.md` fixes which
   question sits in which slot and which words the UI may use;
   `ladekurve-lock.md` fixes the charging claims. Changing a lock is a
   deliberate act with a stated reason. Drifting away from one quietly is not.

5. **Nothing is fetched at runtime.** CSP is `connect-src 'self'`. No CDN, no
   Google Fonts, no HDRI from a third party. System fonts, in-scene lighting.

6. **`localStorage` only with opt-in**, and nothing leaves the browser. No
   account, no database, no tracker.

## Division of labour

`.claude/agents/` — each agent owns a file set and may write nothing else.
That boundary is the whole mechanism; parallel work without it eats itself.

| Agent | Owns |
|---|---|
| `design-system` | `globals.css`, `layout.tsx`, chrome, `components/ui/**` |
| `advisor-ux` | `components/advisor/**`, `app/berater/` |
| `engine` | `lib/engine/**`, `lib/advisor/**`, `data/**` |
| `copy-guard` | `lib/copy.ts`, `labels.ts`, the lock documents |
| `showroom` | `components/showroom/**`, `scripts/**`, `public/models/**` |
| `quality` | read-only auditor; writes only `docs/` |

Open work is in `docs/backlog.md`.

## Five traps this project already fell into

**1. Two agents, one working tree, nothing committed.** On 12.09. a second
process restored the tree from an archive and an hour of finished work vanished
— every file except the one that process had no record of. Forty-eight files of
work had been sitting uncommitted for hours. **Commit before handing the tree
to anyone else**, and never run two writers over one file set.

**2. A union grew a variant and the build died.** `BodyStyle` gained `compact`
in `types.ts` and in `cars.de.json`, but `generate-car-glb.py` still produced
three models and `dims.json` had three entries. A new variant means every
consumer changes in the same commit. `compact` has its own `BODY_DIMS` entry
and its own model now — but note the generator needs `.venv-glb` with trimesh,
shapely and mapbox-earcut, which is gitignored and has to be recreated per
machine. trimesh 5 no longer bundles a triangulation engine.

**3. `ContactShadows` draws its own rectangle.** It has no radial falloff, so
the shadow plane's corners show as a grey diamond under the car — on the dark
ground *and* on the light one, measured down to opacity 0.18 and blur 3.5. It
is gone on purpose; the ground cue is a floor-bounce Lightformer. Do not put it
back without looking at the result.

**4. Half-metal paint looks like plastic.** Car paint is a dielectric with
lacquer over it: low metalness plus clearcoat. `metalness: 0.55` was why the
body read as a toy. Related: the GLB bakes in a disc named `shadow` which must
*leave the scene graph*, not merely be hidden — `Box3.setFromObject` ignores
the visible flag, so a hidden 4 m disc still inflates the bounding box and
makes `<Bounds>` frame the car far too small.

**5. `<Bounds clip>` left the canvas empty.** `clip` pulls the camera's near
and far planes tight around what `<Bounds>` measured — and it measures before
the GLTF has finished loading and before `CarMesh` has dropped the baked shadow
disc, so the planes bracket the wrong volume and the car is clipped away
entirely. The symptom is not a half-drawn car: it is an empty canvas on a
correct background, a live WebGL context, and no console error — which is why
it cost four screenshots and a bisect to find. `fit observe` without `clip` is
what ships.

## One false alarm, so nobody chases it twice

The `hydration mismatch` warning naming `data-gr-ext-installed` and
`data-new-gr-c-s-check-loaded` comes from the **Grammarly browser extension**
rewriting the DOM before React loads. It is not an application bug.
