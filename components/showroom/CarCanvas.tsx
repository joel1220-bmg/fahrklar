"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { ContactShadows, OrbitControls } from "@react-three/drei";
import type { BodyStyle } from "@/lib/engine/types";
import { CarMesh } from "./CarMesh";

type Props = {
  body?: BodyStyle;
  color?: string;
  className?: string;
  autoRotate?: boolean;
};

function Scene({
  body,
  color,
  autoRotate,
}: {
  body: BodyStyle;
  color: string;
  autoRotate: boolean;
}) {
  return (
    <>
      <color attach="background" args={["#242628"]} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[4, 6, 3]} intensity={1.2} />
      <directionalLight position={[-3, 2, -2]} intensity={0.35} color="#8ab4ff" />
      <spotLight position={[2, 4, 3]} intensity={0.55} color="#d4a84b" angle={0.5} />
      <CarMesh body={body} color={color} autoRotate={autoRotate} />
      <ContactShadows position={[0, 0, 0]} opacity={0.45} scale={8} blur={2.5} />
      <OrbitControls
        enablePan={false}
        minPolarAngle={Math.PI / 3}
        maxPolarAngle={Math.PI / 2.1}
        minDistance={4}
        maxDistance={9}
      />
    </>
  );
}

export function CarCanvas({
  body = "hatch",
  color = "#4A6FA5",
  className = "",
  autoRotate = true,
}: Props) {
  return (
    <div className={`relative overflow-hidden rounded-2xl bg-graphite-soft ${className}`}>
      <Suspense
        fallback={
          <div className="flex h-full min-h-[220px] items-center justify-center text-sm text-muted">
            Laden …
          </div>
        }
      >
        <Canvas
          camera={{ position: [3.8, 1.8, 4.2], fov: 38 }}
          dpr={[1, 1.75]}
          gl={{ antialias: true, alpha: false }}
          className="h-full w-full touch-none"
          aria-label="Stilisiertes Auto, per Ziehen drehbar"
        >
          <Scene body={body} color={color} autoRotate={autoRotate} />
        </Canvas>
      </Suspense>
      <p className="pointer-events-none absolute bottom-2 left-3 text-[10px] uppercase tracking-widest text-muted">
        Ziehen zum Drehen
      </p>
    </div>
  );
}
