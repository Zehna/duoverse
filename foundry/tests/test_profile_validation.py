#!/usr/bin/env python3
"""Validates all game profiles in foundry/profiles/ against required specifications."""

import json
import sys
from pathlib import Path

REQUIRED_ROOT_KEYS = [
    "id", "name", "engine", "executable_patterns", "anti_cheat_policy", "injection", "sync"
]
ALLOWED_ENGINES = [
    "unity-mono", "unity-il2cpp", "unreal-4", "unreal-5", "monogame", "godot", "custom"
]


def validate_profile(file_path: Path) -> list[str]:
    errors = []
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
    except Exception as e:
        return [f"Failed to parse JSON: {e}"]

    for key in REQUIRED_ROOT_KEYS:
        if key not in data:
            errors.append(f"Missing required field: '{key}'")

    if data.get("engine") not in ALLOWED_ENGINES:
        errors.append(f"Invalid engine '{data.get('engine')}'. Must be one of {ALLOWED_ENGINES}")

    anti_cheat = data.get("anti_cheat_policy", {})
    if not isinstance(anti_cheat.get("abort_on_kernel_driver"), bool):
        errors.append("anti_cheat_policy.abort_on_kernel_driver must be a boolean")

    sync = data.get("sync", {})
    if sync.get("authority_model") not in ["host_authority", "deterministic_lockstep"]:
        errors.append("sync.authority_model must be 'host_authority' or 'deterministic_lockstep'")

    injection = data.get("injection", {})
    if not isinstance(injection.get("vfs_enabled"), bool):
        errors.append("injection.vfs_enabled must be a boolean")

    return errors


def main():
    repo_root = Path(__file__).resolve().parents[2]
    profiles_dir = repo_root / "foundry" / "profiles"

    profiles = list(profiles_dir.glob("*.json"))
    profiles = [p for p in profiles if not p.name.endswith(".schema.json")]

    if not profiles:
        print("[WARN] No game profiles found to validate.")
        return 0

    total_errors = 0
    print(f"[Duoverse Foundry] Validating {len(profiles)} profile(s)...")

    for profile in profiles:
        errs = validate_profile(profile)
        if errs:
            total_errors += len(errs)
            print(f"[FAIL] {profile.name}:")
            for e in errs:
                print(f"   - {e}")
        else:
            print(f"[PASS] {profile.name}")

    if total_errors > 0:
        print(f"\n[FAIL] Validation finished with {total_errors} error(s).")
        sys.exit(1)

    print("\n[SUCCESS] All game profiles validated successfully!")
    return 0


if __name__ == "__main__":
    sys.exit(main())
