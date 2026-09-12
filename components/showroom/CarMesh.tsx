"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import {
  Color,
  type Group,
  type Mesh,
  type MeshStandardMaterial,
  type Object3D,
} from "three";
import type { BodyStyle } from "@/lib/engine/types";
import dimsJson from "../../public/models/dims.json";

type Props = {
  body: BodyStyle;
  color: string;
  /** @deprecated ignored — mesh does not spin */
  autoRotate?: boolean;
};

/** Named L/W/H (m) from generated dims.json — keep in sync via scripts/generate-car-glb.py */
export const CAR_DIMS: Record<BodyStyle, { L: number; W: number; H: number }> = dimsJson;

const MODEL_URL: Record<BodyStyle, string> = {
  hatch: "/models/hatch.glb",
  sedan: "/models/sedan.glb",
  crossover: "/models/crossover.glb",
};

function tintBody(root: Object3D, color: string) {
  const bodyColor = new Color(color);
  root.traverse((obj) => {
    const mesh = obj as Mesh;
    if (!mesh.isMesh) return;
    mesh.castShadow = mesh.name !== "shadow";
    mesh.receiveShadow = true;

    const mat = mesh.material as MeshStandardMaterial;
    if (!mat || !("color" in mat)) return;

    const name = mesh.name || "";
    if (name === "body") {
      const cloned = mat.clone();
      cloned.color.copy(bodyColor);
      cloned.metalness = 0.55;
      cloned.roughness = 0.35;
      mesh.material = cloned;
      return;
    }
    if (name.startsWith("headlight")) {
      const cloned = mat.clone();
      cloned.color.set("#d4a84b");
      cloned.emissive.set("#d4a84b");
      cloned.emissiveIntensity = 0.85;
      mesh.material = cloned;
      return;
    }
    if (name === "glass" || name.startsWith("side_glass")) {
      const cloned = mat.clone();
      cloned.color.set("#1a2330");
      cloned.metalness = 0.8;
      cloned.roughness = 0.15;
      cloned.transparent = true;
      cloned.opacity = 0.85;
      mesh.material = cloned;
    }
  });
}

/** Stylized generic EV from public/models/{body}.glb — static studio still, no brand logos. */
export function CarMesh({ body, color }: Props) {
  const ref = useRef<Group>(null);
  const url = MODEL_URL[body];
  const { scene } = useGLTF(url);

  const clone = useMemo(() => {
    const c = scene.clone(true);
    tintBody(c, color);
    return c;
  }, [scene, color]);

  useLayoutEffect(() => {
    tintBody(clone, color);
  }, [clone, color]);

  return (
    <group ref={ref} position={[0, -0.2, 0]} rotation={[0, Math.PI * 0.18, 0]}>
      <primitive object={clone} />
    </group>
  );
}

useGLTF.preload(MODEL_URL.hatch);
useGLTF.preload(MODEL_URL.sedan);
useGLTF.preload(MODEL_URL.crossover);
