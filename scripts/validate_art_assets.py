#!/usr/bin/env python3
"""Validate art manifests, generation logs, paths, names, and image headers."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import struct
import sys
from pathlib import Path, PurePosixPath
from typing import Any


IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg"}
ASSET_ID_RE = re.compile(r"^[a-z0-9]+(?:[._][a-z0-9]+)*$")
FILE_NAME_RE = re.compile(r"^[a-z0-9]+(?:_[a-z0-9]+)*_v[0-9]{3}\.(?:png|jpe?g)$")
VERSION_RE = re.compile(r"^v[0-9]{3}$")
SLUG_RE = re.compile(r"^[a-z0-9]+(?:_[a-z0-9]+)*$")
STATUSES = {"planned", "draft", "review", "approved", "retired"}
STATUS_DIRECTORY = {
    "draft": "drafts",
    "review": "review",
    "approved": "approved",
    "retired": "archive",
}


class ArtValidator:
    def __init__(self, root: Path) -> None:
        self.root = root.resolve()
        self.errors: list[str] = []
        self.referenced_images: set[str] = set()
        self.generation_logs: dict[str, dict[str, Any]] = {}

    def error(self, location: str, message: str) -> None:
        self.errors.append(f"{location}: {message}")

    def resolve_repo_path(self, value: str, location: str) -> Path | None:
        posix = PurePosixPath(value)
        if posix.is_absolute() or ".." in posix.parts or "\\" in value:
            self.error(location, "path must be a repository-relative POSIX path")
            return None
        resolved = (self.root / Path(*posix.parts)).resolve()
        try:
            resolved.relative_to(self.root)
        except ValueError:
            self.error(location, "path escapes the repository root")
            return None
        return resolved

    def load_json(self, path: Path) -> Any | None:
        try:
            return json.loads(path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError) as exc:
            self.error(path.as_posix(), f"cannot read JSON: {exc}")
            return None

    def load_generation_logs(self) -> None:
        log_dir = self.root / "assets/art/generation_logs"
        required = {
            "log_id",
            "asset_id",
            "asset_version",
            "model_name",
            "model_version",
            "prompt_version",
            "rendered_prompt",
            "reference_images",
            "seed",
            "width",
            "height",
            "settings",
            "generated_at",
            "source_output",
        }
        for path in sorted(log_dir.glob("*.jsonl")):
            for line_number, raw_line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
                if not raw_line.strip():
                    continue
                location = f"{path.relative_to(self.root).as_posix()}:{line_number}"
                try:
                    record = json.loads(raw_line)
                except json.JSONDecodeError as exc:
                    self.error(location, f"invalid JSONL record: {exc}")
                    continue
                if not isinstance(record, dict):
                    self.error(location, "record must be a JSON object")
                    continue
                missing = sorted(required - record.keys())
                if missing:
                    self.error(location, f"missing fields: {', '.join(missing)}")
                    continue
                log_id = record["log_id"]
                if not isinstance(log_id, str) or not log_id:
                    self.error(location, "log_id must be a non-empty string")
                    continue
                if log_id in self.generation_logs:
                    self.error(location, f"duplicate log_id {log_id!r}")
                    continue
                if not VERSION_RE.fullmatch(str(record["asset_version"])):
                    self.error(location, "asset_version must match vNNN")
                if not isinstance(record["reference_images"], list):
                    self.error(location, "reference_images must be an array")
                if not isinstance(record["settings"], dict):
                    self.error(location, "settings must be an object")
                if not isinstance(record["width"], int) or record["width"] <= 0:
                    self.error(location, "width must be a positive integer")
                if not isinstance(record["height"], int) or record["height"] <= 0:
                    self.error(location, "height must be a positive integer")
                if record.get("is_example") is True:
                    continue
                self.generation_logs[log_id] = record

    def validate_controlled_values(self, values: Any) -> dict[str, list[str]]:
        location = "controlled_values"
        if not isinstance(values, dict):
            self.error(location, "must be an object")
            return {}
        result: dict[str, list[str]] = {}
        for key in ("poses", "expressions", "positions", "framings"):
            items = values.get(key)
            if not isinstance(items, list) or not items:
                self.error(f"{location}.{key}", "must be a non-empty array")
                continue
            if len(items) != len(set(items)):
                self.error(f"{location}.{key}", "contains duplicate values")
            for item in items:
                if not isinstance(item, str) or not SLUG_RE.fullmatch(item):
                    self.error(f"{location}.{key}", f"invalid slug {item!r}")
            result[key] = items
        return result

    def validate_profiles(self, profiles: Any) -> dict[str, dict[str, Any]]:
        if not isinstance(profiles, dict) or not profiles:
            self.error("profiles", "must be a non-empty object")
            return {}
        valid: dict[str, dict[str, Any]] = {}
        for name, profile in profiles.items():
            location = f"profiles.{name}"
            if not isinstance(profile, dict):
                self.error(location, "must be an object")
                continue
            width, height = profile.get("width"), profile.get("height")
            extensions, alpha = profile.get("extensions"), profile.get("alpha")
            if not isinstance(width, int) or width <= 0 or not isinstance(height, int) or height <= 0:
                self.error(location, "width and height must be positive integers")
                continue
            if not isinstance(extensions, list) or not extensions:
                self.error(location, "extensions must be a non-empty array")
                continue
            normalized = [str(item).lower() for item in extensions]
            if any(item not in IMAGE_EXTENSIONS for item in normalized):
                self.error(location, "extensions may contain only .png, .jpg, or .jpeg")
                continue
            if alpha not in {"required", "forbidden", "optional"}:
                self.error(location, "alpha must be required, forbidden, or optional")
                continue
            valid[name] = profile
        return valid

    def validate_characters(
        self, characters: Any, controlled: dict[str, list[str]]
    ) -> dict[str, dict[str, Any]]:
        if not isinstance(characters, dict):
            self.error("characters", "must be an object")
            return {}
        valid: dict[str, dict[str, Any]] = {}
        for character_id, character in characters.items():
            location = f"characters.{character_id}"
            if not SLUG_RE.fullmatch(character_id) or not isinstance(character, dict):
                self.error(location, "invalid character ID or definition")
                continue
            spec = character.get("spec")
            if not isinstance(spec, str):
                self.error(location, "spec must be a path")
            else:
                resolved = self.resolve_repo_path(spec, f"{location}.spec")
                if resolved is not None and not resolved.is_file():
                    self.error(f"{location}.spec", f"file does not exist: {spec}")
            for field, global_key in (
                ("allowed_poses", "poses"),
                ("allowed_expressions", "expressions"),
            ):
                items = character.get(field)
                if not isinstance(items, list) or not items:
                    self.error(f"{location}.{field}", "must be a non-empty array")
                elif not set(items).issubset(set(controlled.get(global_key, []))):
                    self.error(f"{location}.{field}", "contains values outside controlled_values")
            valid[character_id] = character
        return valid

    def expected_file_name(self, asset: dict[str, Any], version: str) -> str | None:
        kind = asset.get("kind")
        if kind == "character":
            return f"{asset.get('character_id')}_{asset.get('pose')}_{asset.get('expression')}_{version}.png"
        if kind == "background":
            return f"{asset.get('location')}_{asset.get('variant')}_{version}"
        if kind == "event_cg":
            return f"cg_{asset.get('scene')}_{asset.get('beat')}_{version}"
        return None

    def validate_image(
        self, path: Path, relative_path: str, profile: dict[str, Any], sha256: Any
    ) -> None:
        extension = path.suffix.lower()
        if extension not in [str(item).lower() for item in profile["extensions"]]:
            self.error(relative_path, f"extension {extension} is not allowed by its profile")
            return
        try:
            width, height, has_alpha = image_info(path)
        except (OSError, ValueError, struct.error) as exc:
            self.error(relative_path, f"cannot read image header: {exc}")
            return
        expected_size = (profile["width"], profile["height"])
        if (width, height) != expected_size:
            self.error(relative_path, f"size is {width}x{height}; expected {expected_size[0]}x{expected_size[1]}")
        if profile["alpha"] == "required" and not has_alpha:
            self.error(relative_path, "alpha channel is required")
        if profile["alpha"] == "forbidden" and has_alpha:
            self.error(relative_path, "alpha channel is forbidden")
        if sha256 is not None:
            actual = hashlib.sha256(path.read_bytes()).hexdigest()
            if sha256 != actual:
                self.error(relative_path, "sha256 does not match the file")

    def validate_asset(
        self,
        asset: Any,
        index: int,
        profiles: dict[str, dict[str, Any]],
        characters: dict[str, dict[str, Any]],
        controlled: dict[str, list[str]],
    ) -> str | None:
        location = f"assets[{index}]"
        if not isinstance(asset, dict):
            self.error(location, "must be an object")
            return None
        asset_id = asset.get("id")
        kind = asset.get("kind")
        profile_name = asset.get("profile")
        if not isinstance(asset_id, str) or not ASSET_ID_RE.fullmatch(asset_id):
            self.error(f"{location}.id", "must be a lowercase dotted stable ID")
            return None
        if kind not in {"character", "background", "event_cg"}:
            self.error(location, f"invalid kind {kind!r}")
        profile = profiles.get(profile_name)
        if profile is None:
            self.error(location, f"unknown profile {profile_name!r}")
        expected_profile = {
            "character": "character_sprite",
            "background": "background_16_9",
            "event_cg": "event_cg_16_9",
        }.get(kind)
        if expected_profile is not None and profile_name != expected_profile:
            self.error(location, f"{kind} assets must use profile {expected_profile!r}")

        if kind == "character":
            character_id = asset.get("character_id")
            character = characters.get(character_id)
            if character is None:
                self.error(location, f"unknown character_id {character_id!r}")
            pose, expression = asset.get("pose"), asset.get("expression")
            if pose not in controlled.get("poses", []):
                self.error(location, f"pose {pose!r} is not controlled")
            if expression not in controlled.get("expressions", []):
                self.error(location, f"expression {expression!r} is not controlled")
            if character is not None:
                if pose not in character.get("allowed_poses", []):
                    self.error(location, f"pose {pose!r} is not allowed for {character_id}")
                if expression not in character.get("allowed_expressions", []):
                    self.error(location, f"expression {expression!r} is not allowed for {character_id}")
            expected_id = f"character.{character_id}.{pose}.{expression}"
        elif kind == "background":
            expected_id = f"background.{asset.get('location')}.{asset.get('variant')}"
        else:
            expected_id = f"event_cg.{asset.get('scene')}.{asset.get('beat')}"
        if asset_id != expected_id:
            self.error(f"{location}.id", f"expected {expected_id!r} from asset fields")

        versions = asset.get("versions")
        if not isinstance(versions, list) or not versions:
            self.error(location, "versions must be a non-empty array")
            return asset_id
        seen_versions: set[str] = set()
        ordered_versions: list[str] = []
        version_by_id: dict[str, dict[str, Any]] = {}
        for version_index, version_data in enumerate(versions):
            version_location = f"{location}.versions[{version_index}]"
            if not isinstance(version_data, dict):
                self.error(version_location, "must be an object")
                continue
            version = version_data.get("version")
            status = version_data.get("status")
            path_value = version_data.get("path")
            log_id = version_data.get("generation_log_id")
            if not isinstance(version, str) or not VERSION_RE.fullmatch(version):
                self.error(version_location, "version must match vNNN")
                continue
            if version in seen_versions:
                self.error(version_location, f"duplicate version {version}")
            seen_versions.add(version)
            ordered_versions.append(version)
            version_by_id[version] = version_data
            if status not in STATUSES:
                self.error(version_location, f"invalid status {status!r}")
                continue
            if status == "planned":
                if path_value is not None or log_id is not None:
                    self.error(version_location, "planned versions must not have a path or generation log")
                continue
            if not isinstance(path_value, str) or not path_value:
                self.error(version_location, "non-planned versions require a path")
                continue
            if not isinstance(log_id, str) or log_id not in self.generation_logs:
                self.error(version_location, "generation_log_id must reference an existing log")
            else:
                log = self.generation_logs[log_id]
                if log.get("asset_id") != asset_id or log.get("asset_version") != version:
                    self.error(version_location, "generation log asset_id/version does not match")
            resolved = self.resolve_repo_path(path_value, f"{version_location}.path")
            if resolved is None:
                continue
            normalized = PurePosixPath(path_value).as_posix()
            self.referenced_images.add(normalized)
            path_parts = PurePosixPath(path_value).parts
            status_directory = STATUS_DIRECTORY.get(status)
            if kind == "character":
                expected_prefix = ("assets", "art", "characters", str(asset.get("character_id")))
            elif kind == "background":
                expected_prefix = ("assets", "art", "backgrounds")
            else:
                expected_prefix = ("assets", "art", "event_cg")
            if path_parts[: len(expected_prefix)] != expected_prefix:
                self.error(version_location, f"path must be under {'/'.join(expected_prefix)}/")
            if status_directory and (
                len(path_parts) <= len(expected_prefix)
                or path_parts[len(expected_prefix)] != status_directory
            ):
                self.error(version_location, f"{status} file must be directly under {status_directory}/")
            if not resolved.is_file():
                self.error(version_location, f"image does not exist: {path_value}")
                continue
            file_name = resolved.name
            if not FILE_NAME_RE.fullmatch(file_name):
                self.error(version_location, f"invalid image file name {file_name!r}")
            expected_name = self.expected_file_name(asset, version)
            if expected_name is not None:
                if kind == "character" and file_name != expected_name:
                    self.error(version_location, f"expected file name {expected_name!r}")
                elif kind != "character" and Path(file_name).stem != expected_name:
                    self.error(version_location, f"expected file stem {expected_name!r}")
            if status == "approved":
                if not version_data.get("sha256"):
                    self.error(version_location, "approved versions require sha256")
                if not version_data.get("reviewed_by") or not version_data.get("reviewed_at"):
                    self.error(version_location, "approved versions require reviewer and review time")
            if profile is not None:
                self.validate_image(resolved, path_value, profile, version_data.get("sha256"))

        expected_versions = [f"v{number:03d}" for number in range(1, len(ordered_versions) + 1)]
        if ordered_versions != expected_versions:
            self.error(location, "versions must be ordered, contiguous, and start at v001")

        active = asset.get("active_version")
        if active is not None:
            active_data = version_by_id.get(active)
            if active_data is None:
                self.error(location, "active_version does not exist in versions")
            elif active_data.get("status") != "approved":
                self.error(location, "active_version must point to an approved version")
        return asset_id

    def find_unregistered_images(self) -> None:
        art_root = self.root / "assets/art"
        for category in ("characters", "backgrounds", "event_cg"):
            base = art_root / category
            if not base.exists():
                self.error(category, "required asset directory is missing")
                continue
            for path in base.rglob("*"):
                if not path.is_file() or path.suffix.lower() not in IMAGE_EXTENSIONS:
                    continue
                relative = path.relative_to(self.root).as_posix()
                if "references" in path.relative_to(base).parts:
                    continue
                if relative not in self.referenced_images:
                    self.error(relative, "image is not registered in the manifest")

    def validate(self, manifest_path: Path) -> list[str]:
        self.load_generation_logs()
        manifest = self.load_json(manifest_path)
        if not isinstance(manifest, dict):
            return self.errors
        if manifest.get("schema_version") != 1:
            self.error("schema_version", "only schema version 1 is supported")
        controlled = self.validate_controlled_values(manifest.get("controlled_values"))
        profiles = self.validate_profiles(manifest.get("profiles"))
        characters = self.validate_characters(manifest.get("characters"), controlled)
        assets = manifest.get("assets")
        if not isinstance(assets, list):
            self.error("assets", "must be an array")
            assets = []
        seen_ids: set[str] = set()
        for index, asset in enumerate(assets):
            asset_id = self.validate_asset(asset, index, profiles, characters, controlled)
            if asset_id in seen_ids:
                self.error(f"assets[{index}].id", f"duplicate asset ID {asset_id!r}")
            if asset_id is not None:
                seen_ids.add(asset_id)
        self.find_unregistered_images()
        return self.errors


def image_info(path: Path) -> tuple[int, int, bool]:
    data = path.read_bytes()
    if data.startswith(b"\x89PNG\r\n\x1a\n"):
        if len(data) < 33 or data[12:16] != b"IHDR":
            raise ValueError("invalid PNG IHDR")
        width, height = struct.unpack(">II", data[16:24])
        color_type = data[25]
        has_alpha = color_type in {4, 6} or b"tRNS" in data
        return width, height, has_alpha
    if data.startswith(b"\xff\xd8"):
        offset = 2
        while offset + 4 <= len(data):
            if data[offset] != 0xFF:
                offset += 1
                continue
            marker = data[offset + 1]
            offset += 2
            if marker in {0xD8, 0xD9}:
                continue
            if offset + 2 > len(data):
                break
            segment_length = struct.unpack(">H", data[offset : offset + 2])[0]
            if marker in {0xC0, 0xC1, 0xC2, 0xC3, 0xC5, 0xC6, 0xC7, 0xC9, 0xCA, 0xCB, 0xCD, 0xCE, 0xCF}:
                if offset + 7 > len(data):
                    break
                height, width = struct.unpack(">HH", data[offset + 3 : offset + 7])
                return width, height, False
            if segment_length < 2:
                break
            offset += segment_length
        raise ValueError("JPEG dimensions not found")
    raise ValueError("unsupported or invalid image format")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    default_root = Path(__file__).resolve().parents[1]
    parser.add_argument("--root", type=Path, default=default_root, help="repository root")
    parser.add_argument(
        "--manifest",
        type=Path,
        default=None,
        help="manifest path (defaults to assets/art/manifests/art-assets.json under root)",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    root = args.root.resolve()
    manifest = args.manifest or root / "assets/art/manifests/art-assets.json"
    validator = ArtValidator(root)
    errors = validator.validate(manifest.resolve())
    if errors:
        print(f"Art asset validation failed with {len(errors)} error(s):")
        for error in errors:
            print(f"- {error}")
        return 1
    print(f"Art asset validation passed ({len(validator.referenced_images)} image(s), {len(validator.generation_logs)} log record(s)).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
