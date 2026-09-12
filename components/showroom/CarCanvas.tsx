"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { Bounds, Environment, Lightformer } from "@react-three/drei";
import type { BodyStyle } from "@/lib/engine/types";
import { CarMesh } from "./CarMesh";

type Props = {
  body?: BodyStyle;
  color?: string;
  className?: string;
  /** @deprecated ignored — cars are static studio stills */
  autoRotate?: boolean;
};

/**
 * The pale ground the whole page sits on. Kept a touch below --color-canvas
 * (#f4f4f2) so the canvas reads as a recessed studio rather than as a hole in
 * the layout, and a touch above --color-sunken (#ececea) so the frame is not
 * a visible box either. If the page ground changes, change this with it.
 */
const STUDIO_GROUND = "#f0f0ee";

/**
 * The room the car stands in, as seen by its own reflections. Darker than the
 * page on purpose: it is the mid-grey a photo studio actually is, and it is
 * what gives the white softboxes below something to be brighter than. Set it
 * to the page colour and every specular disappears into the surroundings.
 */
const STUDIO_ROOM = "#e0e0dd";

/**
 * Studio rig built from Lightformers, not an HDRI file.
 *
 * drei's <Environment preset="..."> fetches its map from a CDN, which this
 * project cannot do: connect-src is 'self' and there are no external assets.
 * Lightformer children render the environment map in-scene instead — same
 * look, no network, no CSP change.
 */
function StudioEnv() {
  return (
    <Environment resolution={256}>
      {/* The room itself. Children are portalled into the environment's own
          scene, so this background is what the cube camera bakes into the
          env map everywhere no lightformer covers. Without it that space is
          black, and a clearcoat body on a light page mirrors a black room. */}
      <color attach="background" args={[STUDIO_ROOM]} />
      {/* Broad overhead key — the wide highlight that runs across roof and hood. */}
      <Lightformer
        form="rect"
        intensity={3}
        position={[0, 5, 1]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={[9, 5, 1]}
        color="#ffffff"
      />
      {/* Long side strips. This is what reads as "car photo": a stretched
          specular running the length of the flank. Without them, paint is flat. */}
      <Lightformer
        form="rect"
        intensity={2.4}
        position={[5, 2.2, 1]}
        rotation={[0, -Math.PI / 2, 0]}
        scale={[12, 2.2, 1]}
        color="#dfe8ff"
      />
      <Lightformer
        form="rect"
        intensity={1.5}
        position={[-5, 2.2, -1]}
        rotation={[0, Math.PI / 2, 0]}
        scale={[12, 2.2, 1]}
        color="#cfd8e8"
      />
      {/* Rim from behind, cutting the far edge of the roof and shoulder away
          from the backdrop. On the dark page this was warm gold at 2.8 — that
          existed only to lift a dark car off a dark ground, and on a pale page
          it reads as a sunset stripe on the paintwork. Neutral and quieter
          here: on a light ground the silhouette is already given, so the rim
          only has to keep the far edge from dissolving into the backdrop. */}
      <Lightformer
        form="rect"
        intensity={2}
        position={[-2.5, 1.6, -5]}
        rotation={[0, Math.PI, 0]}
        scale={[6, 1.6, 1]}
        color="#f2f4f7"
      />
      {/* Floor bounce. On the dark theme this was a dim near-black panel that
          only had to keep sills off pure black; a pale floor genuinely throws
          light back up, so it is brighter and the colour of the ground. It is
          also the only ground cue the car gets — see the ContactShadows note
          below and in CarMesh. */}
      <Lightformer
        form="rect"
        intensity={0.85}
        position={[0, -1.5, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        scale={[9, 9, 1]}
        color="#e6e6e3"
      />
    </Environment>
  );
}

function Scene({ body, color }: { body: BodyStyle; color: string }) {
  return (
    <>
      <color attach="background" args={[STUDIO_GROUND]} />
      <StudioEnv />
      {/* Low: the env map is doing the lighting. Ambient only lifts the few
          cavities no lightformer reaches, and more of it flattens the paint. */}
      <ambientLight intensity={0.25} />
      {/* The same canvas serves a 520px hero and a 140px card. A fixed camera
          cannot frame both: what fills the hero leaves the card car tiny.
          Bounds fits the car to whatever box it is given and re-fits on resize,
          so neither caller has to pass a framing hint. */}
      <Bounds fit observe margin={1.1}>
        <CarMesh body={body} color={color} />
      </Bounds>
      {/* No `clip` on Bounds. It pulls the camera's near and far planes tight
          around what it measured, and it measures before the GLTF has finished
          loading and before CarMesh has dropped the baked shadow disc - so the
          planes end up bracketing the wrong volume and the car is clipped away
          entirely. The symptom is not a half-drawn car, it is an empty canvas
          on a correct background, with a live WebGL context and no console
          error, which is what makes it worth writing down. Measured: removing
          `clip` alone brings the car back. */}
      {/* No ContactShadows here on purpose, on this theme either. Its shadow
          plane is a rectangle with no radial falloff, so its own square edge
          stays visible as a dark diamond under the car at every opacity worth
          having — measured down to 0.18, on the dark ground and again on this
          pale one. The ground cue comes from the floor bounce in StudioEnv. */}
    </>
  );
}

export function CarCanvas({
  body = "hatch",
  color = "#4A6FA5",
  className = "",
}: Props) {
  return (
    <div
      /* bg-sunken, not the bg-graphite-soft alias: that alias now resolves to
         white, which would flash a white block before the canvas paints. This
         is the colour the studio ground is next to. */
      className={`pointer-events-none relative overflow-hidden rounded-2xl bg-sunken ${className}`}
    >
      <Suspense
        fallback={
          <div className="flex h-full min-h-[140px] items-center justify-center text-sm text-muted">
            Laden …
          </div>
        }
      >
        <Canvas
          /* Longer lens, tighter framing: product shot, not wide-angle snapshot. */
          camera={{ position: [5.9, 1.95, 6.5], fov: 28 }}
          dpr={[1, 1.75]}
          gl={{ antialias: true, alpha: false }}
          className="h-full w-full"
          aria-label="Abbildung des Autos"
        >
          <Scene body={body} color={color} />
        </Canvas>
      </Suspense>
    </div>
  );
}
