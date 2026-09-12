#!/usr/bin/env python3
"""
Generate stylized generic EV car GLBs for Fahrklar showroom.

No logos, badges, or trademarked OEM design language — readable silhouettes only.
Closer to 2026 EV shapes (compact hatch, low fastback sedan, tall crossover)
while remaining tintable per car color.

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

import trimesh
from shapely.geometry import Polygon
from trimesh.creation import box, cylinder, extrude_polygon
from trimesh.visual.material import PBRMaterial

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "public" / "models"

# ---------------------------------------------------------------------------
# Named dimensions (meters) — exported to dims.json for CarMesh / tooling
# Silhouettes aimed at: hatch≈ID.3, sedan≈Model 3/ID.7, crossover≈Model Y/Elroq
# ---------------------------------------------------------------------------

BODY_DIMS: dict[str, dict] = {
    # Compact EV hatch: short rear OH, tall greenhouse, cab-forward
    "hatch": {
        "L": 4.26,
        "W": 1.81,
        "H": 1.56,
        "wheelbase": 2.75,
        "wheel_r": 0.33,
        "hood_len": 0.72,
        "rear_overhang": 0.42,
        "roof_h": 0.66,
        "belt_h": 0.68,
        "nose_drop": 0.28,
        "windshield_rake": 0.52,
        "rear_glass_rake": 0.28,
        "roof_flat": 1.35,
        "ride": "low",
        "deck": "hatch",
        "arch_bulge": 0.055,
        "light_style": "compact",
    },
    # Compact EV (ID.3 / Born / EV3 class): the hatch silhouette grown up —
    # longer wheelbase, taller greenhouse, still a hatch tail, not a fastback.
    # NOTE: rear_overhang is carried for documentation only; nothing in this
    # script reads it (grep it — only hood_len, wheelbase, roof_h, belt_h and
    # the rake/flat terms actually drive _side_profile()).
    "compact": {
        "L": 4.40,
        "W": 1.84,
        "H": 1.60,
        "wheelbase": 2.80,
        "wheel_r": 0.335,
        "hood_len": 0.80,
        "rear_overhang": 0.48,
        "roof_h": 0.68,
        "belt_h": 0.70,
        "nose_drop": 0.26,
        "windshield_rake": 0.58,
        "rear_glass_rake": 0.32,
        "roof_flat": 1.42,
        "ride": "low",
        "deck": "hatch",
        "arch_bulge": 0.058,
        "light_style": "compact",
    },
    # Low fastback sedan: long WB, long hood/deck, low sleek roof
    "sedan": {
        "L": 4.78,
        "W": 1.85,
        "H": 1.44,
        "wheelbase": 2.98,
        "wheel_r": 0.325,
        "hood_len": 1.22,
        "rear_overhang": 1.08,
        "roof_h": 0.42,
        "belt_h": 0.64,
        "nose_drop": 0.36,
        "windshield_rake": 0.82,
        "rear_glass_rake": 0.95,
        "roof_flat": 0.78,
        "ride": "low",
        "deck": "sedan",
        "arch_bulge": 0.045,
        "light_style": "slim",
    },
    # Tall crossover: short overhangs, high belt, floating roof feel
    "crossover": {
        "L": 4.55,
        "W": 1.92,
        "H": 1.68,
        "wheelbase": 2.86,
        "wheel_r": 0.36,
        "hood_len": 0.92,
        "rear_overhang": 0.55,
        "roof_h": 0.70,
        "belt_h": 0.84,
        "nose_drop": 0.22,
        "windshield_rake": 0.55,
        "rear_glass_rake": 0.42,
        "roof_flat": 1.38,
        "ride": "high",
        "deck": "crossover",
        "arch_bulge": 0.07,
        "light_style": "bar",
        "floating_roof": True,
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
    return d["wheel_r"] + (0.15 if d.get("ride") == "high" else 0.08)


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
    if is_sedan:
        rear_meet_y = belt * 0.52
        rear_drop_x = 0.32
        rear_drop_y = belt * 0.45
        rear_glass_meet = rear_meet_y
        # Slight fastback peak
        roof_peak = roof + 0.01
    elif deck == "crossover":
        rear_meet_y = belt * 0.95
        rear_drop_x = 0.08
        rear_drop_y = belt * 0.82
        rear_glass_meet = belt * 0.97
        roof_peak = roof
    else:
        # Hatch: short upright rear, tall greenhouse
        rear_meet_y = belt * 0.90
        rear_drop_x = 0.06
        rear_drop_y = belt * 0.74
        rear_glass_meet = belt * 0.94
        roof_peak = roof

    # Soft wheel-arch hints along the rocker (visual silhouette dips)
    wb = d["wheelbase"]
    arch = d.get("arch_bulge", 0.05)
    fx, rx = wb / 2, -wb / 2

    pts = [
        (nose_x, nose_tip_y),
        (nose_x - 0.12, (hood_y + nose_tip_y) * 0.5),
        (hood_end + 0.05, hood_y),
        (hood_end, belt),
        (ws_top, roof_peak),
        ((ws_top + roof_rear) * 0.5, roof_peak + (0.015 if is_sedan else 0)),
        (roof_rear, roof_peak),
        (rear_glass_bot, rear_glass_meet),
        (tail_x + rear_drop_x, rear_drop_y),
        (tail_x, floor_y + 0.10),
        (tail_x + 0.05, floor_y),
        # Rocker with arch dips (rear then front)
        (rx - 0.22, floor_y),
        (rx, floor_y + arch * 0.35),
        (rx + 0.22, floor_y),
        (fx - 0.22, floor_y),
        (fx, floor_y + arch * 0.35),
        (fx + 0.22, floor_y),
        (nose_x - 0.16, floor_y),
        (nose_x, floor_y + 0.04),
    ]
    cleaned: list[tuple[float, float]] = []
    for p in pts:
        if not cleaned or math.hypot(p[0] - cleaned[-1][0], p[1] - cleaned[-1][1]) > 0.015:
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


def _add_wheel_arch(
    scene: trimesh.Scene,
    d: dict,
    x: float,
    z_sign: float,
    idx: int,
    body_mat: PBRMaterial,
) -> None:
    """Distinct flared wheel arch (half-torus-ish box ring) — no logos."""
    wr = d["wheel_r"]
    bulge = d.get("arch_bulge", 0.05)
    arch = box(extents=[wr * 2.15, wr * 1.55, 0.06])
    arch.apply_translation([x, wr * 0.95, z_sign * (d["W"] * 0.48 + bulge * 0.5)])
    scene.add_geometry(
        _apply_mat(arch, body_mat),
        geom_name=f"arch_{idx}",
        node_name=f"arch_{idx}",
    )


def build_car_scene(body: str) -> trimesh.Scene:
    d = BODY_DIMS[body]
    scene = trimesh.Scene()

    body_mat = _pbr([0.29, 0.435, 0.647, 1.0], metal=0.55, rough=0.35)  # #4A6FA5 default
    glass_mat = _pbr([0.10, 0.14, 0.19, 0.88], metal=0.8, rough=0.15)
    black_mat = _pbr([0.06, 0.06, 0.07, 1.0], metal=0.2, rough=0.55)  # floating roof / belt
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

    # Beltline crease (thin strip) for readable character
    belt_strip = box(extents=[d["L"] * 0.72, 0.025, d["W"] * 0.98])
    belt_strip.apply_translation([0, belt - 0.02, 0])
    scene.add_geometry(
        _apply_mat(belt_strip, body_mat),
        geom_name="beltline",
        node_name="beltline",
    )

    # Floating roof (crossover): dark band under roof edge
    if d.get("floating_roof"):
        float_band = box(extents=[cabin_len * 1.05, 0.04, d["W"] * 0.92])
        float_band.apply_translation([cabin_mid_x, roof - 0.06, 0])
        scene.add_geometry(
            _apply_mat(float_band, black_mat),
            geom_name="roof_float",
            node_name="roof_float",
        )

    light_y = floor_y + d["belt_h"] * 0.42
    style = d.get("light_style", "compact")
    for i, z_sign in enumerate((1.0, -1.0)):
        if style == "slim":
            hl = box(extents=[0.08, 0.07, 0.38])
            tl = box(extents=[0.05, 0.06, 0.42])
        elif style == "bar":
            hl = box(extents=[0.09, 0.09, 0.32])
            tl = box(extents=[0.05, 0.08, 0.36])
        else:
            hl = box(extents=[0.10, 0.12, 0.24])
            tl = box(extents=[0.06, 0.11, 0.26])
        hl.apply_translation([half - 0.05, light_y, z_sign * d["W"] * 0.34])
        scene.add_geometry(
            _apply_mat(hl, light_mat),
            geom_name=f"headlight_{i}",
            node_name=f"headlight_{i}",
        )
        tl.apply_translation([-half + 0.04, light_y + 0.03, z_sign * d["W"] * 0.32])
        scene.add_geometry(
            _apply_mat(tl, tail_mat),
            geom_name=f"taillight_{i}",
            node_name=f"taillight_{i}",
        )

    # Slim full-width light bar accents (sedan/crossover signature, still generic)
    if style in ("slim", "bar"):
        bar_w = d["W"] * 0.78
        front_bar = box(extents=[0.04, 0.03, bar_w])
        front_bar.apply_translation([half - 0.02, light_y + 0.02, 0])
        scene.add_geometry(
            _apply_mat(front_bar, light_mat),
            geom_name="headlight_bar",
            node_name="headlight_bar",
        )
        rear_bar = box(extents=[0.03, 0.025, bar_w])
        rear_bar.apply_translation([-half + 0.02, light_y + 0.04, 0])
        scene.add_geometry(
            _apply_mat(rear_bar, tail_mat),
            geom_name="taillight_bar",
            node_name="taillight_bar",
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
            _add_wheel_arch(scene, d, x, z_sign, idx, body_mat)

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
