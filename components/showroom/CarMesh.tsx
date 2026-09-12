"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import {
  Color,
  MeshPhysicalMaterial,
  type Group,
  type Mesh,
  type MeshStandardMaterial,
  type Object3D,
} from "three";
import { toCreasedNormals } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { BodyStyle } from "@/lib/engine/types";
import dimsJson from "../../public/models/dims.json";

type Props = {
  body: BodyStyle;
  color: string;
  /** @deprecated ignored — mesh does not spin */
  autoRotate?: boolean;
};

/** Named L/W/H (m) from generated dims.json — keep in sync via scripts/generate-car-glb.py */
type Dim = { L: number; W: number; H: number };

/** Named L/W/H (m) from generated dims.json — keep in sync via scripts/generate-car-glb.py */
export const CAR_DIMS: Record<BodyStyle, Dim> = dimsJson;

const MODEL_URL: Record<BodyStyle, string> = {
  hatch: "/models/hatch.glb",
  compact: "/models/compact.glb",
  sedan: "/models/sedan.glb",
  crossover: "/models/crossover.glb",
};

/**
 * The bodies come from an extruded side profile, so every vertex normal is
 * flat-shaded and the roofline reads as a row of facets. Creasing at 50°
 * smooths the long curves (roof, hood, shoulder) while keeping the real
 * edges — beltline, wheel arch cut, sill — sharp.
 */
const CREASE_ANGLE = (50 * Math.PI) / 180;

function smoothOnce(mesh: Mesh) {
  if (mesh.userData.creased) return;
  mesh.geometry = toCreasedNormals(mesh.geometry, CREASE_ANGLE);
  mesh.userData.creased = true;
}

/**
 * Drop the disc the GLB bakes in under the car (geometry name "shadow",
 * radius L*0.42). Its 0.35 alpha does not survive export, so it renders as an
 * opaque near-black ellipse wider than the car. On the pale ground that is not
 * a contact shadow, it is a hole punched through the page.
 *
 * It has to leave the graph, not merely get visible=false: Box3.setFromObject
 * ignores the visible flag, so a hidden 4 m disc still inflates the bounding
 * box and makes <Bounds> frame the car far too small.
 *
 * Nothing replaces it. ContactShadows was tried and measured on both the dark
 * and the light ground: its plane has no radial falloff, so the plane's own
 * corners show as a dark diamond under the car at every opacity worth having,
 * down to 0.18. The ground cue comes from the floor bounce in the studio rig.
 */
function dropBakedShadow(root: Object3D) {
  const doomed: Object3D[] = [];
  root.traverse((obj) => {
    if (obj.name === "shadow") doomed.push(obj);
  });
  for (const obj of doomed) obj.removeFromParent();
}

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
      smoothOnce(mesh);
      /* Car paint is a dielectric with a clear lacquer over it — NOT a metal.
         The old metalness 0.55 is what made the body read as painted plastic:
         a half-metal surface takes its colour from its reflections instead of
         from its pigment. Low metalness plus clearcoat is actual automotive
         paint — and on a bright studio that difference matters more than it
         did on the dark one, because a half-metal body would now mirror the
         pale surroundings and lose its colour almost completely. */
      mesh.material = new MeshPhysicalMaterial({
        color: bodyColor,
        metalness: 0.05,
        roughness: 0.28,
        clearcoat: 1,
        clearcoatRoughness: 0.06,
        envMapIntensity: 1.15,
      });
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
      smoothOnce(mesh);
      const cloned = mat.clone();
      /* Dark, smooth, strongly env-lit: glazing reads as glass through the
         softboxes it reflects, not through its own colour. */
      cloned.color.set("#12171f");
      cloned.metalness = 0.1;
      cloned.roughness = 0.08;
      cloned.envMapIntensity = 1.6;
      cloned.transparent = true;
      cloned.opacity = 0.9;
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
    dropBakedShadow(c);
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

/* All four bodies: three cards can render side by side, so none of them should
   be the one that pops in late. */
useGLTF.preload(MODEL_URL.hatch);
useGLTF.preload(MODEL_URL.compact);
useGLTF.preload(MODEL_URL.sedan);
useGLTF.preload(MODEL_URL.crossover);
