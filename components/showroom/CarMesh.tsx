"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import type { BodyStyle } from "@/lib/engine/types";

type Props = {
  body: BodyStyle;
  color: string;
  autoRotate?: boolean;
};

/** Stylized generic EV silhouette — tapered nose/tail, no brand logos. */
export function CarMesh({ body, color, autoRotate = true }: Props) {
  const ref = useRef<Group>(null);
  const dims = useMemo(() => {
    switch (body) {
      case "sedan":
        return { L: 4.6, W: 1.85, H: 1.35, roofZ: 0.55, cabinL: 2.2 };
      case "crossover":
        return { L: 4.4, W: 1.9, H: 1.55, roofZ: 0.72, cabinL: 2.0 };
      default:
        return { L: 4.1, W: 1.8, H: 1.4, roofZ: 0.62, cabinL: 1.9 };
    }
  }, [body]);

  useFrame((_, dt) => {
    if (!autoRotate || !ref.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    ref.current.rotation.y += dt * 0.25;
  });

  const wheelR = 0.32;
  const wheelY = wheelR;
  const bodyY = wheelR + 0.18;
  const glass = "#1a2330";

  return (
    <group ref={ref} position={[0, -0.2, 0]}>
      {/* Underbody shadow disc */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
        <circleGeometry args={[2.2, 32]} />
        <meshBasicMaterial color="#0a0a0a" transparent opacity={0.35} />
      </mesh>

      {/* Main body — slightly lower mid section */}
      <mesh position={[0, bodyY + dims.H * 0.28, 0]} castShadow>
        <boxGeometry args={[dims.L * 0.78, dims.H * 0.45, dims.W]} />
        <meshStandardMaterial color={color} metalness={0.55} roughness={0.35} />
      </mesh>

      {/* Tapered nose */}
      <mesh
        position={[dims.L * 0.38, bodyY + dims.H * 0.22, 0]}
        castShadow
        scale={[1, 0.85, 0.92]}
      >
        <boxGeometry args={[dims.L * 0.22, dims.H * 0.38, dims.W * 0.95]} />
        <meshStandardMaterial color={color} metalness={0.55} roughness={0.35} />
      </mesh>

      {/* Tapered tail */}
      <mesh
        position={[-dims.L * 0.36, bodyY + dims.H * 0.26, 0]}
        castShadow
        scale={[1, 0.9, 0.94]}
      >
        <boxGeometry args={[dims.L * 0.2, dims.H * 0.4, dims.W * 0.96]} />
        <meshStandardMaterial color={color} metalness={0.55} roughness={0.35} />
      </mesh>

      {/* Cabin / roof */}
      <mesh position={[0.05, bodyY + dims.H * 0.55 + dims.roofZ * 0.15, 0]} castShadow>
        <boxGeometry args={[dims.cabinL, dims.roofZ, dims.W * 0.88]} />
        <meshStandardMaterial color={color} metalness={0.5} roughness={0.4} />
      </mesh>

      {/* Windows */}
      <mesh position={[0.05, bodyY + dims.H * 0.55 + dims.roofZ * 0.2, 0]}>
        <boxGeometry args={[dims.cabinL * 0.85, dims.roofZ * 0.55, dims.W * 0.9]} />
        <meshStandardMaterial
          color={glass}
          metalness={0.8}
          roughness={0.15}
          transparent
          opacity={0.85}
        />
      </mesh>

      {/* Headlights — warm gold accent */}
      <mesh position={[dims.L * 0.46, bodyY + dims.H * 0.28, dims.W * 0.3]}>
        <boxGeometry args={[0.08, 0.12, 0.26]} />
        <meshStandardMaterial color="#d4a84b" emissive="#d4a84b" emissiveIntensity={0.85} />
      </mesh>
      <mesh position={[dims.L * 0.46, bodyY + dims.H * 0.28, -dims.W * 0.3]}>
        <boxGeometry args={[0.08, 0.12, 0.26]} />
        <meshStandardMaterial color="#d4a84b" emissive="#d4a84b" emissiveIntensity={0.85} />
      </mesh>

      {/* Tail lights */}
      <mesh position={[-dims.L * 0.44, bodyY + dims.H * 0.3, dims.W * 0.3]}>
        <boxGeometry args={[0.06, 0.1, 0.22]} />
        <meshStandardMaterial color="#a33" emissive="#a33" emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[-dims.L * 0.44, bodyY + dims.H * 0.3, -dims.W * 0.3]}>
        <boxGeometry args={[0.06, 0.1, 0.22]} />
        <meshStandardMaterial color="#a33" emissive="#a33" emissiveIntensity={0.5} />
      </mesh>

      {/* Wheels */}
      {(
        [
          [dims.L * 0.28, wheelY, dims.W * 0.48],
          [dims.L * 0.28, wheelY, -dims.W * 0.48],
          [-dims.L * 0.3, wheelY, dims.W * 0.48],
          [-dims.L * 0.3, wheelY, -dims.W * 0.48],
        ] as const
      ).map((p, i) => (
        <group key={i} position={[p[0], p[1], p[2]]}>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[wheelR, wheelR, 0.22, 24]} />
            <meshStandardMaterial color="#111" metalness={0.3} roughness={0.7} />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[wheelR * 0.55, wheelR * 0.55, 0.24, 16]} />
            <meshStandardMaterial color="#444" metalness={0.7} roughness={0.3} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
