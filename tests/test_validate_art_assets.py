import struct
import tempfile
import unittest
import zlib
from pathlib import Path

from scripts.validate_art_assets import ArtValidator, image_info


REPOSITORY_ROOT = Path(__file__).resolve().parents[1]


def write_rgba_png(path: Path, width: int = 1, height: int = 1) -> None:
    def chunk(name: bytes, payload: bytes) -> bytes:
        body = name + payload
        return struct.pack(">I", len(payload)) + body + struct.pack(">I", zlib.crc32(body))

    scanline = b"\x00" + b"\x00\x00\x00\x00" * width
    raw = scanline * height
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0))
        + chunk(b"IDAT", zlib.compress(raw))
        + chunk(b"IEND", b"")
    )


class ArtValidatorTests(unittest.TestCase):
    def test_repository_sample_manifest_is_valid(self) -> None:
        validator = ArtValidator(REPOSITORY_ROOT)
        manifest = REPOSITORY_ROOT / "assets/art/manifests/art-assets.json"
        self.assertEqual([], validator.validate(manifest))

    def test_png_dimensions_and_alpha_are_read(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            image = Path(temporary_directory) / "sample.png"
            write_rgba_png(image, 2, 3)
            self.assertEqual((2, 3, True), image_info(image))

    def test_unregistered_lifecycle_image_is_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            root = Path(temporary_directory)
            for category in ("characters", "backgrounds", "event_cg"):
                (root / "assets/art" / category).mkdir(parents=True)
            image = root / "assets/art/characters/seoyeon/drafts/seoyeon_neutral_standing_neutral_v001.png"
            write_rgba_png(image)
            validator = ArtValidator(root)
            validator.find_unregistered_images()
            self.assertTrue(any("not registered" in error for error in validator.errors))

    def test_wrong_profile_size_is_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            root = Path(temporary_directory)
            image = root / "sample_v001.png"
            write_rgba_png(image, 1, 1)
            validator = ArtValidator(root)
            validator.validate_image(
                image,
                "sample_v001.png",
                {"width": 2, "height": 2, "extensions": [".png"], "alpha": "required"},
                None,
            )
            self.assertTrue(any("expected 2x2" in error for error in validator.errors))


if __name__ == "__main__":
    unittest.main()

