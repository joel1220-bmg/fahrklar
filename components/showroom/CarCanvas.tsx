"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { ContactShadows } from "@react-three/drei";
import type { BodyStyle } from "@/lib/engine/types";
import { CarMesh } from "./CarMesh";

type Props = {
  body?: BodyStyle;
  color?: string;
  className?: string;
  /** @deprecated ignored — cars are static studio stills */
  autoRotate?: boolean;
};

function Scene({ body, color }: { body: BodyStyle; color: string }) {
  return (
    <>
      <color attach="background" args={["#242628"]} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[4, 6, 3]} intensity={1.2} />
      <directionalLight position={[-3, 2, -2]} intensity={0.35} color="#8ab4ff" />
      <spotLight position={[2, 4, 3]} intensity={0.55} color="#d4a84b" angle={0.5} />
      <CarMesh body={body} color={color} />
      <ContactShadows position={[0, 0, 0]} opacity={0.45} scale={8} blur={2.5} />
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
      className={`pointer-events-none relative overflow-hidden rounded-2xl bg-graphite-soft ${className}`}
    >
      <Suspense
        fallback={
          <div className="flex h-full min-h-[140px] items-center justify-center text-sm text-muted">
            Laden …
          </div>
        }
      >
        <Canvas
          camera={{ position: [3.8, 1.8, 4.2], fov: 38 }}
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
