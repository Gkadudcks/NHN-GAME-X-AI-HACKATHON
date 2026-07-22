#!/usr/bin/env python3
"""Remove a light background matte from an existing RGBA sprite without regenerating it."""

from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np
from PIL import Image
from scipy.ndimage import distance_transform_edt


def decontaminate(image: Image.Image, edge_radius: float = 6.0) -> Image.Image:
    rgba = np.asarray(image.convert("RGBA"), dtype=np.float32)
    rgb = rgba[:, :, :3]
    alpha = rgba[:, :, 3]
    visible = alpha > 0
    opaque = alpha >= 248

    distance_inside = distance_transform_edt(visible)
    _, nearest = distance_transform_edt(~opaque, return_indices=True)
    nearest_rgb = rgb[nearest[0], nearest[1]]

    edge = visible & (distance_inside <= edge_radius) & (alpha < 255)
    coverage = np.clip(alpha / 255.0, 1 / 255.0, 1.0)
    unmatte = np.clip(
        (rgb - 255.0 * (1.0 - coverage[:, :, None])) / coverage[:, :, None],
        0,
        255,
    )

    # High-coverage pixels retain the white-matte estimate; very thin antialiasing
    # borrows color from the nearest opaque subject pixel to avoid unstable division.
    nearest_weight = np.clip((0.55 - coverage) / 0.50, 0, 1)[:, :, None]
    corrected = unmatte * (1.0 - nearest_weight) + nearest_rgb * nearest_weight
    rgb[edge] = corrected[edge]

    # A few fully white remnant pixels can survive the original extraction. Remove
    # only those touching transparency; opaque whites inside the shirt are untouched.
    near_white = np.min(rgb, axis=2) >= 248
    remnant = visible & (distance_inside <= 1.0) & near_white
    alpha[remnant] = 0
    rgb[alpha == 0] = 0

    output = np.dstack((np.clip(rgb, 0, 255), np.clip(alpha, 0, 255))).astype(np.uint8)
    return Image.fromarray(output, "RGBA")


def fit_character_canvas(image: Image.Image, width: int = 1024, height: int = 1536) -> Image.Image:
    scale = min(width / image.width, height / image.height)
    size = (round(image.width * scale), round(image.height * scale))
    resized = image.resize(size, Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    canvas.alpha_composite(resized, ((width - size[0]) // 2, (height - size[1]) // 2))
    return canvas


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--edge-radius", type=float, default=6.0)
    parser.add_argument("--width", type=int, default=1024)
    parser.add_argument("--height", type=int, default=1536)
    args = parser.parse_args()

    source = Image.open(args.input).convert("RGBA")
    corrected = decontaminate(source, edge_radius=args.edge_radius)
    corrected = fit_character_canvas(corrected, args.width, args.height)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    corrected.save(args.output, format="PNG", optimize=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
