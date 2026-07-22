#!/usr/bin/env python3
"""Remove a baked light-gray transparency checkerboard from a character sprite."""

from __future__ import annotations

import argparse
from pathlib import Path

import cv2
import numpy as np
from PIL import Image
from scipy.ndimage import distance_transform_edt


def remove_checkerboard(image: Image.Image) -> Image.Image:
    rgb = np.asarray(image.convert("RGB"), dtype=np.float32)

    # ChatGPT's transparency preview uses two nearly neutral, very light tiles.
    channel_spread = np.ptp(rgb, axis=2)
    brightness = np.mean(rgb, axis=2)
    # Generated checkerboards are not perfectly flat: PNG pixels vary by several
    # levels and some tile boundaries dip to about 238. Keep the threshold broad
    # enough for the exterior to remain connected, while the illustrated subject's
    # dark contour prevents the flood fill from entering pale clothing or skin.
    background_candidate = (channel_spread <= 10) & (brightness >= 235)

    height, width = background_candidate.shape
    foreground_evidence = (brightness < 225) | (channel_spread > 14)
    ys, xs = np.nonzero(foreground_evidence)
    if not len(xs):
        raise ValueError("No foreground subject detected")

    padding = 8
    x0 = max(0, int(xs.min()) - padding)
    x1 = min(width, int(xs.max()) + padding + 1)
    y0 = max(0, int(ys.min()) - padding)
    y1 = min(height, int(ys.max()) + padding + 1)

    mask = np.full((height, width), cv2.GC_BGD, dtype=np.uint8)
    mask[y0:y1, x0:x1] = cv2.GC_PR_FGD
    probable_background = background_candidate.copy()
    probable_background[:y0] = False
    probable_background[y1:] = False
    probable_background[:, :x0] = False
    probable_background[:, x1:] = False
    mask[probable_background] = cv2.GC_PR_BGD
    mask[foreground_evidence] = cv2.GC_FGD

    background_model = np.zeros((1, 65), np.float64)
    foreground_model = np.zeros((1, 65), np.float64)
    cv2.grabCut(
        rgb.astype(np.uint8),
        mask,
        None,
        background_model,
        foreground_model,
        6,
        cv2.GC_INIT_WITH_MASK,
    )
    subject = (mask == cv2.GC_FGD) | (mask == cv2.GC_PR_FGD)
    distance_inside = distance_transform_edt(subject)
    alpha = np.clip(distance_inside * 255.0, 0, 255).astype(np.uint8)
    alpha[~subject] = 0

    rgba = np.dstack((rgb.astype(np.uint8), alpha))
    rgba[alpha == 0, :3] = 0
    return Image.fromarray(rgba, "RGBA")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()

    result = remove_checkerboard(Image.open(args.input))
    args.output.parent.mkdir(parents=True, exist_ok=True)
    result.save(args.output, format="PNG", optimize=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
