#!/usr/bin/env python3
"""Remove a light background matte from an existing RGBA sprite without regenerating it."""

from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np
from PIL import Image

try:
    from scipy.ndimage import distance_transform_edt
except ModuleNotFoundError:
    distance_transform_edt = None


def nearest_opaque_colors(rgb: np.ndarray, opaque: np.ndarray) -> np.ndarray:
    """Extend opaque subject colors into the narrow antialiased edge."""
    colors = rgb.copy()
    known = opaque.copy()
    height, width = known.shape
    for _ in range(32):
        if known.all():
            break
        previous = known.copy()
        for dy, dx in ((-1, 0), (1, 0), (0, -1), (0, 1), (-1, -1), (-1, 1), (1, -1), (1, 1)):
            source_y = slice(max(0, -dy), min(height, height - dy))
            source_x = slice(max(0, -dx), min(width, width - dx))
            target_y = slice(max(0, dy), min(height, height + dy))
            target_x = slice(max(0, dx), min(width, width + dx))
            available = previous[source_y, source_x] & ~known[target_y, target_x]
            colors[target_y, target_x][available] = colors[source_y, source_x][available]
            known[target_y, target_x][available] = True
    return colors


def keep_largest_component(rgba: np.ndarray) -> np.ndarray:
    """Remove detached extraction specks and backdrop decorations."""
    visible = rgba[:, :, 3] > 0
    seen = np.zeros_like(visible)
    largest: list[tuple[int, int]] = []
    height, width = visible.shape
    for start_y, start_x in zip(*np.where(visible)):
        if seen[start_y, start_x]:
            continue
        component: list[tuple[int, int]] = []
        stack = [(int(start_y), int(start_x))]
        seen[start_y, start_x] = True
        while stack:
            y, x = stack.pop()
            component.append((y, x))
            for dy, dx in ((-1, 0), (1, 0), (0, -1), (0, 1)):
                next_y, next_x = y + dy, x + dx
                if 0 <= next_y < height and 0 <= next_x < width and visible[next_y, next_x] and not seen[next_y, next_x]:
                    seen[next_y, next_x] = True
                    stack.append((next_y, next_x))
        if len(component) > len(largest):
            largest = component
    keep = np.zeros_like(visible)
    if largest:
        ys, xs = zip(*largest)
        keep[ys, xs] = True
    rgba[~keep] = 0
    return rgba


def decontaminate(image: Image.Image, edge_radius: float = 6.0) -> Image.Image:
    rgba = np.asarray(image.convert("RGBA"), dtype=np.float32)
    rgb = rgba[:, :, :3]
    alpha = rgba[:, :, 3]
    visible = alpha > 0
    opaque = alpha >= 248

    if distance_transform_edt is not None:
        distance_inside = distance_transform_edt(visible)
        _, nearest = distance_transform_edt(~opaque, return_indices=True)
        nearest_rgb = rgb[nearest[0], nearest[1]]
        edge = visible & (distance_inside <= edge_radius) & (alpha < 255)
        boundary = distance_inside <= 1.0
    else:
        nearest_rgb = nearest_opaque_colors(rgb, opaque)
        edge = visible & (alpha < 255)
        padded = np.pad(visible, 1, constant_values=False)
        surrounded = np.ones_like(visible)
        for dy in range(3):
            for dx in range(3):
                surrounded &= padded[dy : dy + visible.shape[0], dx : dx + visible.shape[1]]
        boundary = visible & ~surrounded
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
    remnant = visible & boundary & near_white
    alpha[remnant] = 0
    rgb[alpha == 0] = 0

    output = np.dstack((np.clip(rgb, 0, 255), np.clip(alpha, 0, 255))).astype(np.uint8)
    output = keep_largest_component(output)
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
