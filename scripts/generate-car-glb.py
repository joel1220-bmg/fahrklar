#!/usr/bin/env python3
"""
Generate stylized generic EV car GLBs for Fahrklar showroom.

No logos, badges, or trademarked OEM design language — readable silhouettes only.

Usage:
  .venv-glb/bin/python scripts/generate-car-glb.py
  .venv-glb/bin/python scripts/generate-car-glb.py --only hatch

Outputs:
  public/models/hatch.glb
  public/models/sedan.glb
  public/models/crossover.glb
  public/models/dims.json
"""

from __future__ import annotations

import argparse
import json
import math
from pathlib import Path

import numpy as np
import trimesh
from shapely.geometry import Polygon
from trimesh.creation import box, cylinder, extrude_polygon
from trimesh.visual.material import PBRMaterial

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "public" / "models"

# ---------------------------------------------------------------------------
# Named dimensions (meters) — exported to dims.json for CarMesh / tooling
# ---------------------------------------------------------------------------

BODY_DIMS: dict[str, dict] = {
    # ID.3-class (generic): compact L, cab-forward, upright greenhouse, short rear OH
    "hatch": {
        "L": 4.22,
        "W": 1.81,
        "H": 1.56,
        "wheelbase": 2.72,
        "wheel_r": 0.33,
        "hood_len": 0.78,
        "rear_overhang": 0.48,
        "roof_h": 0.62,
        "belt_h": 0.70,
        "nose_drop": 0.26,
        "windshield_rake": 0.48,
        "rear_glass_rake": 0.32,
        "roof_flat": 1.28,
        "ride": "low",
        "deck": "hatch",
    },
    # Model-3-class (generic): longer L/WB, longer hood/deck, lower sleek roof
    "sedan": {
        "L": 4.68,
        "W": 1.85,
        "H": 1.42,
        "wheelbase": 2.92,
        "wheel_r": 0.32,
        "hood_len": 1.18,
        "rear_overhang": 1.05,
        "roof_h": 0.44,
        "belt_h": 0.66,
        "nose_drop": 0.34,
        "windshield_rake": 0.78,
        "rear_glass_rake": 0.85,
        "roof_flat": 0.88,
        "ride": "low",
        "deck": "sedan",
    },
    # EV3-class (generic): mid L, taller stance, high belt, boxier upright cabin
    "crossover": {
        "L": 4.35,
        "W": 1.92,
        "H": 1.66,
        "wheelbase": 2.72,
        "wheel_r": 0.35,
        "hood_len": 0.88,
        "rear_overhang": 0.62,
        "roof_h": 0.68,
        "belt_h": 0.82,
        "nose_drop": 0.24,
        "windshield_rake": 0.52,
        "rear_glass_rake": 0.38,
        "roof_flat": 1.30,
        "ride": "high",
        "deck": "crossover",
    },
}


def _pbr(rgba: list[float], metal: float = 0.4, rough: float = 0.4) -> PBRMaterial:
    return PBRMaterial(
        baseColorFactor=rgba,
        metallicFactor=metal,
        roughnessFactor=rough,
    )


def _apply_mat(mesh: trimesh.Trimesh, mat: PBRMaterial) -> trimesh.Trimesh:
    mesh = mesh.copy()
    mesh.visual = trimesh.visual.TextureVisuals(material=mat)
    return mesh


def _extrude(profile: list[tuple[float, float]], width: float) -> trimesh.Trimesh:
    poly = Polygon(profile)
    if not poly.is_valid:
        poly = poly.buffer(0)
    if poly.is_empty or poly.area < 1e-6:
        raise ValueError("Invalid profile polygon")
    m = extrude_polygon(poly, height=width)
    m.apply_translation([0, 0, -width / 2])
    return m


def _floor_y(d: dict) -> float:
    """Ride height above ground (wheel radius + body clearance)."""
    return d["wheel_r"] + (0.14 if d.get("ride") == "high" else 0.08)


def _side_profile(d: dict) -> list[tuple[float, float]]:
    """Side silhouette: X forward+, Y up+. Origin at length center, Y=0 ground."""
    L = d["L"]
    half = L / 2
    floor_y = _floor_y(d)
    belt = floor_y + d["belt_h"]
    roof = min(belt + d["roof_h"], d["H"] - 0.02)

    nose_x = half
    hood_end = half - d["hood_len"]
    ws_top = hood_end - d["windshield_rake"]
    roof_rear = ws_top - d["roof_flat"]
    rear_glass_bot = roof_rear - d["rear_glass_rake"]
    tail_x = -half

    nose_tip_y = floor_y + d["nose_drop"] * 0.35
    hood_y = belt - 0.04
    deck = d.get("deck", "hatch")
    is_sedan = deck == "sedan"
    # Hatch: short upright rear; crossover: boxier higher rear meet; sedan: low deck
    if is_sedan:
        rear_meet_y = belt * 0.55
        rear_drop_x = 0.28
        rear_drop_y = belt * 0.48
        rear_glass_meet = rear_meet_y
    elif deck == "crossover":
        rear_meet_y = belt * 0.94
        rear_drop_x = 0.10
        rear_drop_y = belt * 0.78
        rear_glass_meet = belt * 0.96
    else:
        rear_meet_y = belt * 0.88
        rear_drop_x = 0.08
        rear_drop_y = belt * 0.72
        rear_glass_meet = belt * 0.92

    pts = [
        (nose_x, nose_tip_y),
        (nose_x - 0.14, (hood_y + nose_tip_y) * 0.5),
        (hood_end + 0.06, hood_y),
        (hood_end, belt),
        (ws_top, roof),
        (roof_rear, roof),
        (rear_glass_bot, rear_glass_meet),
        (tail_x + rear_drop_x, rear_drop_y),
        (tail_x, floor_y + 0.10),
        (tail_x + 0.06, floor_y),
        (nose_x - 0.18, floor_y),
        (nose_x, floor_y + 0.04),
    ]
    cleaned: list[tuple[float, float]] = []
    for p in pts:
        if not cleaned or math.hypot(p[0] - cleaned[-1][0], p[1] - cleaned[-1][1]) > 0.02:
            cleaned.append(p)
    return cleaned


def _glass_profile(d: dict) -> list[tuple[float, float]]:
    L = d["L"]
    half = L / 2
    floor_y = _floor_y(d)
    belt = floor_y + d["belt_h"]
    roof = min(belt + d["roof_h"], d["H"] - 0.02)
    glass_bot = belt + 0.05
    glass_top = roof - 0.05

    hood_end = half - d["hood_len"]
    ws_top = hood_end - d["windshield_rake"]
    roof_rear = ws_top - d["roof_flat"]
    rear_glass_bot = roof_rear - d["rear_glass_rake"]
    inset = 0.10
    return [
        (hood_end - inset * 0.2, glass_bot),
        (ws_top + inset * 0.15, glass_top),
        (roof_rear - inset * 0.15, glass_top),
        (rear_glass_bot + inset * 0.8, glass_bot),
    ]


def build_car_scene(body: str) -> trimesh.Scene:
    d = BODY_DIMS[body]
    scene = trimesh.Scene()

    body_mat = _pbr([0.29, 0.435, 0.647, 1.0], metal=0.55, rough=0.35)  # #4A6FA5 default
    glass_mat = _pbr([0.10, 0.14, 0.19, 0.88], metal=0.8, rough=0.15)
    wheel_mat = _pbr([0.07, 0.07, 0.07, 1.0], metal=0.3, rough=0.7)
    rim_mat = _pbr([0.27, 0.27, 0.27, 1.0], metal=0.7, rough=0.3)
    light_mat = _pbr([0.831, 0.659, 0.294, 1.0], metal=0.2, rough=0.25)  # #d4a84b
    tail_mat = _pbr([0.47, 0.12, 0.12, 1.0], metal=0.3, rough=0.4)
    shadow_mat = _pbr([0.04, 0.04, 0.04, 0.35], metal=0.0, rough=1.0)

    body_mesh = _apply_mat(_extrude(_side_profile(d), width=d["W"] * 0.96), body_mat)
    scene.add_geometry(body_mesh, geom_name="body", node_name="body")

    try:
        glass = _apply_mat(_extrude(_glass_profile(d), width=d["W"] * 0.86), glass_mat)
        scene.add_geometry(glass, geom_name="glass", node_name="glass")
    except Exception as exc:
        print(f"  warn: glass profile skipped ({exc})")

    wr = d["wheel_r"]
    floor_y = _floor_y(d)
    belt = floor_y + d["belt_h"]
    roof = min(belt + d["roof_h"], d["H"] - 0.02)
    half = d["L"] / 2
    hood_end = half - d["hood_len"]
    ws_top = hood_end - d["windshield_rake"]
    roof_rear = ws_top - d["roof_flat"]
    cabin_mid_x = (ws_top + roof_rear) / 2
    cabin_len = max(abs(ws_top - roof_rear) * 0.85, 0.4)
    glass_h = max((roof - belt) * 0.55, 0.2)

    for i, z_sign in enumerate((1.0, -1.0)):
        side = box(extents=[cabin_len, glass_h, 0.035])
        side.apply_translation(
            [cabin_mid_x, belt + (roof - belt) * 0.55, z_sign * (d["W"] * 0.485)]
        )
        scene.add_geometry(
            _apply_mat(side, glass_mat),
            geom_name=f"side_glass_{i}",
            node_name=f"side_glass_{i}",
        )

    light_y = floor_y + d["belt_h"] * 0.42
    for i, z_sign in enumerate((1.0, -1.0)):
        hl = box(extents=[0.10, 0.11, 0.26])
        hl.apply_translation([half - 0.06, light_y, z_sign * d["W"] * 0.34])
        scene.add_geometry(
            _apply_mat(hl, light_mat),
            geom_name=f"headlight_{i}",
            node_name=f"headlight_{i}",
        )
        tl = box(extents=[0.06, 0.10, 0.28])
        tl.apply_translation([-half + 0.05, light_y + 0.02, z_sign * d["W"] * 0.32])
        scene.add_geometry(
            _apply_mat(tl, tail_mat),
            geom_name=f"taillight_{i}",
            node_name=f"taillight_{i}",
        )

    wb = d["wheelbase"]
    track = d["W"] * 0.92
    for wi, x in enumerate((wb / 2, -wb / 2)):
        for zj, z_sign in enumerate((1.0, -1.0)):
            idx = wi * 2 + zj
            tire = cylinder(radius=wr, height=0.22, sections=32)
            tire.apply_translation([x, wr, z_sign * track / 2])
            scene.add_geometry(
                _apply_mat(tire, wheel_mat),
                geom_name=f"tire_{idx}",
                node_name=f"tire_{idx}",
            )
            rim = cylinder(radius=wr * 0.55, height=0.24, sections=24)
            rim.apply_translation([x, wr, z_sign * track / 2])
            scene.add_geometry(
                _apply_mat(rim, rim_mat),
                geom_name=f"rim_{idx}",
                node_name=f"rim_{idx}",
            )

    shadow = cylinder(radius=d["L"] * 0.42, height=0.01, sections=48)
    shadow.apply_translation([0, 0.005, 0])
    scene.add_geometry(_apply_mat(shadow, shadow_mat), geom_name="shadow", node_name="shadow")

    return scene


def export_all(only: str | None = None) -> dict:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    bodies = [only] if only else list(BODY_DIMS.keys())
    dims_out: dict = {}

    for body in bodies:
        if body not in BODY_DIMS:
            raise SystemExit(f"Unknown body: {body}")
        d = BODY_DIMS[body]
        dims_out[body] = {"L": d["L"], "W": d["W"], "H": d["H"]}
        scene = build_car_scene(body)
        path = OUT_DIR / f"{body}.glb"
        scene.export(path.as_posix(), file_type="glb")
        n_geom = len(scene.geometry)
        print(f"Wrote {path}  geometries={n_geom}")

    dims_path = OUT_DIR / "dims.json"
    existing: dict = {}
    if dims_path.exists() and only:
        try:
            existing = json.loads(dims_path.read_text())
        except json.JSONDecodeError:
            existing = {}
    if only:
        existing.update(dims_out)
        for k, v in BODY_DIMS.items():
            existing.setdefault(k, {"L": v["L"], "W": v["W"], "H": v["H"]})
    else:
        existing = dims_out

    dims_path.write_text(json.dumps(existing, indent=2) + "\n")
    print(f"Wrote {dims_path}")
    print(json.dumps(existing, indent=2))
    return existing


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--only", choices=sorted(BODY_DIMS.keys()), default=None)
    args = ap.parse_args()
    export_all(only=args.only)


if __name__ == "__main__":
    main()
